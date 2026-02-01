import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Instagram, 
  Plus, 
  Trash2, 
  Settings,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SellerChannel = Tables<'seller_channels'>;

export function ChannelSettings() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<SellerChannel[]>([]);
  const [sellers, setSellers] = useState<Tables<'profiles'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({
    channel_type: 'whatsapp' as 'whatsapp' | 'instagram',
    instance_name: '',
    user_id: ''
  });

  useEffect(() => {
    fetchChannels();
    if (isAdmin()) {
      fetchSellers();
    }
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    let query = supabase.from('seller_channels').select('*');
    
    if (!isAdmin()) {
      query = query.eq('user_id', user?.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching channels:', error);
    } else {
      setChannels(data || []);
    }
    setLoading(false);
  };

  const fetchSellers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setSellers(data);
  };

  const handleAddChannel = async () => {
    const userId = isAdmin() && newChannel.user_id ? newChannel.user_id : user?.id;
    
    if (!userId) return;

    const { error } = await supabase.from('seller_channels').insert({
      user_id: userId,
      channel_type: newChannel.channel_type,
      instance_name: newChannel.instance_name,
      is_active: true
    });

    if (error) {
      if (error.code === '23505') {
        toast({ 
          title: 'Canal já existe', 
          description: 'Esse vendedor já tem um canal com esse nome', 
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'Erro', description: 'Não foi possível adicionar o canal', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Canal adicionado!' });
      setDialogOpen(false);
      setNewChannel({ channel_type: 'whatsapp', instance_name: '', user_id: '' });
      fetchChannels();
    }
  };

  const handleToggleChannel = async (channel: SellerChannel) => {
    const { error } = await supabase
      .from('seller_channels')
      .update({ is_active: !channel.is_active })
      .eq('id', channel.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o canal', variant: 'destructive' });
    } else {
      fetchChannels();
    }
  };

  const handleDeleteChannel = async (channel: SellerChannel) => {
    const { error } = await supabase
      .from('seller_channels')
      .delete()
      .eq('id', channel.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível remover o canal', variant: 'destructive' });
    } else {
      toast({ title: 'Canal removido' });
      fetchChannels();
    }
  };

  const getSellerName = (userId: string) => {
    const seller = sellers.find(s => s.id === userId);
    return seller?.nome || 'Desconhecido';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuração de Canais</h2>
          <p className="text-muted-foreground">Configure as instâncias de WhatsApp e Instagram por vendedor</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Canal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Canal</DialogTitle>
              <DialogDescription>
                Configure uma nova instância de WhatsApp ou Instagram
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Canal</Label>
                <Select
                  value={newChannel.channel_type}
                  onValueChange={(v) => setNewChannel({ ...newChannel, channel_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-green-500" />
                        WhatsApp
                      </div>
                    </SelectItem>
                    <SelectItem value="instagram">
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Instagram
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome da Instância</Label>
                <Input
                  placeholder="Ex: WhatsApp Vendas 1"
                  value={newChannel.instance_name}
                  onChange={(e) => setNewChannel({ ...newChannel, instance_name: e.target.value })}
                />
              </div>

              {isAdmin() && (
                <div className="space-y-2">
                  <Label>Vendedor</Label>
                  <Select
                    value={newChannel.user_id}
                    onValueChange={(v) => setNewChannel({ ...newChannel, user_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddChannel} disabled={!newChannel.instance_name}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum canal configurado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione instâncias de WhatsApp ou Instagram para começar a receber mensagens
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Canal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {channel.channel_type === 'whatsapp' ? (
                      <MessageSquare className="w-5 h-5 text-green-500" />
                    ) : (
                      <Instagram className="w-5 h-5 text-pink-500" />
                    )}
                    <CardTitle className="text-lg">{channel.instance_name}</CardTitle>
                  </div>
                  <Switch
                    checked={channel.is_active || false}
                    onCheckedChange={() => handleToggleChannel(channel)}
                  />
                </div>
                {isAdmin() && (
                  <CardDescription>
                    Vendedor: {getSellerName(channel.user_id)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                    {channel.is_active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteChannel(channel)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Integração via Webhook
          </CardTitle>
          <CardDescription>
            Configure seu N8N ou automação para enviar mensagens para o Inbox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono text-muted-foreground">
              POST /functions/v1/webhook-inbox
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Estrutura do payload esperado:</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "channel_type": "whatsapp" | "instagram",
  "external_contact_id": "5511999999999",
  "contact_name": "Nome do Contato",
  "contact_phone": "+5511999999999",
  "message": "Conteúdo da mensagem",
  "origem": "trafego_pago" | "inbound" | "outbound"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
