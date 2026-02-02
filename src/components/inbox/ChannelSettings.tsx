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
  XCircle,
  QrCode,
  Smartphone,
  RefreshCw,
  Wifi,
  WifiOff,
  ExternalLink
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SellerChannel = Tables<'seller_channels'>;

type ChannelConfig = {
  status?: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
  qr_code?: string;
  last_connected?: string;
  evolution_instance?: string;
  instagram_token?: string;
};

export function ChannelSettings() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<SellerChannel[]>([]);
  const [sellers, setSellers] = useState<Tables<'profiles'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
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

    const initialConfig: ChannelConfig = {
      status: 'disconnected'
    };

    const { error } = await supabase.from('seller_channels').insert({
      user_id: userId,
      channel_type: newChannel.channel_type,
      instance_name: newChannel.instance_name,
      is_active: false,
      config: initialConfig as any
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
      toast({ title: 'Canal adicionado!', description: 'Agora conecte sua conta' });
      setDialogOpen(false);
      setNewChannel({ channel_type: 'whatsapp', instance_name: '', user_id: '' });
      fetchChannels();
    }
  };

  const handleConnectWhatsApp = async (channel: SellerChannel) => {
    setConnectingChannel(channel.id);
    
    // Simulate QR code generation - in production this would call Evolution API
    const mockQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp-connect-${channel.id}-${Date.now()}`;
    
    const updatedConfig: ChannelConfig = {
      ...(channel.config as ChannelConfig || {}),
      status: 'qr_ready',
      qr_code: mockQrCode
    };

    const { error } = await supabase
      .from('seller_channels')
      .update({ config: updatedConfig as any })
      .eq('id', channel.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível gerar o QR Code', variant: 'destructive' });
    } else {
      toast({ 
        title: 'QR Code gerado!', 
        description: 'Escaneie com seu WhatsApp para conectar' 
      });
      fetchChannels();
    }
    
    setConnectingChannel(null);
  };

  const handleSimulateConnection = async (channel: SellerChannel) => {
    const updatedConfig: ChannelConfig = {
      ...(channel.config as ChannelConfig || {}),
      status: 'connected',
      qr_code: undefined,
      last_connected: new Date().toISOString()
    };

    const { error } = await supabase
      .from('seller_channels')
      .update({ 
        config: updatedConfig as any,
        is_active: true 
      })
      .eq('id', channel.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível conectar', variant: 'destructive' });
    } else {
      toast({ title: 'WhatsApp conectado!', description: 'Suas conversas serão sincronizadas' });
      fetchChannels();
    }
  };

  const handleDisconnect = async (channel: SellerChannel) => {
    const updatedConfig: ChannelConfig = {
      ...(channel.config as ChannelConfig || {}),
      status: 'disconnected',
      qr_code: undefined
    };

    const { error } = await supabase
      .from('seller_channels')
      .update({ 
        config: updatedConfig as any,
        is_active: false 
      })
      .eq('id', channel.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível desconectar', variant: 'destructive' });
    } else {
      toast({ title: 'Canal desconectado' });
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

  const getChannelConfig = (channel: SellerChannel): ChannelConfig => {
    return (channel.config as ChannelConfig) || { status: 'disconnected' };
  };

  const renderChannelCard = (channel: SellerChannel) => {
    const config = getChannelConfig(channel);
    const isWhatsApp = channel.channel_type === 'whatsapp';

    return (
      <Card key={channel.id} className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isWhatsApp ? (
                <MessageSquare className="w-5 h-5 text-green-500" />
              ) : (
                <Instagram className="w-5 h-5 text-pink-500" />
              )}
              <CardTitle className="text-lg">{channel.instance_name}</CardTitle>
            </div>
            <Badge 
              variant={config.status === 'connected' ? 'default' : 'secondary'}
              className={config.status === 'connected' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
            >
              {config.status === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Conectado
                </>
              ) : config.status === 'qr_ready' ? (
                <>
                  <QrCode className="w-3 h-3 mr-1" />
                  Aguardando
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>
          {isAdmin() && (
            <CardDescription>
              Vendedor: {getSellerName(channel.user_id)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code Area for WhatsApp */}
          {isWhatsApp && config.status === 'qr_ready' && config.qr_code && (
            <div className="flex flex-col items-center p-4 bg-white rounded-lg">
              <img 
                src={config.qr_code} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
              <p className="text-xs text-gray-600 mt-2 text-center">
                Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => handleSimulateConnection(channel)}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Simular Conexão
              </Button>
            </div>
          )}

          {/* Instagram Connection */}
          {!isWhatsApp && config.status !== 'connected' && (
            <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
              <Instagram className="w-12 h-12 text-pink-500 mb-2" />
              <p className="text-sm text-muted-foreground text-center mb-3">
                Conecte sua conta do Instagram Business
              </p>
              <Button size="sm" variant="outline" onClick={() => handleSimulateConnection(channel)}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Conectar Instagram
              </Button>
            </div>
          )}

          {/* Connected Status */}
          {config.status === 'connected' && (
            <div className="flex flex-col items-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Canal ativo</span>
              </div>
              {config.last_connected && (
                <p className="text-xs text-muted-foreground mt-1">
                  Conectado desde: {new Date(config.last_connected).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {config.status === 'disconnected' && isWhatsApp && (
              <Button
                className="flex-1"
                onClick={() => handleConnectWhatsApp(channel)}
                disabled={connectingChannel === channel.id}
              >
                {connectingChannel === channel.id ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-1" />
                )}
                Gerar QR Code
              </Button>
            )}
            
            {config.status === 'connected' && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleDisconnect(channel)}
              >
                <WifiOff className="w-4 h-4 mr-1" />
                Desconectar
              </Button>
            )}

            {config.status === 'qr_ready' && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleConnectWhatsApp(channel)}
                disabled={connectingChannel === channel.id}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Novo QR
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDeleteChannel(channel)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
            <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
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
        <Tabs defaultValue="whatsapp">
          <TabsList>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="whatsapp" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channels
                .filter(c => c.channel_type === 'whatsapp')
                .map(renderChannelCard)}
            </div>
            {channels.filter(c => c.channel_type === 'whatsapp').length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum canal WhatsApp configurado
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="instagram" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channels
                .filter(c => c.channel_type === 'instagram')
                .map(renderChannelCard)}
            </div>
            {channels.filter(c => c.channel_type === 'instagram').length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum canal Instagram configurado
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Integração via Webhook
          </CardTitle>
          <CardDescription>
            Configure seu N8N ou Evolution API para enviar mensagens para o Inbox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono text-muted-foreground break-all">
              POST https://taiqemygdfdzxoinrayx.supabase.co/functions/v1/webhook-inbox
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Estrutura do payload esperado:</p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
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
