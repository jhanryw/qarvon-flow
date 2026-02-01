import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadAdded: () => void;
}

export function AddLeadDialog({ open, onOpenChange, onLeadAdded }: AddLeadDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState({
    nome: '',
    empresa: '',
    cargo: '',
    telefone: '',
    email: '',
    segmento: '',
    localizacao: '',
    origem: 'outbound' as 'inbound' | 'outbound' | 'indicacao' | 'pap' | 'trafego_pago',
    observacoes: ''
  });

  const handleSave = async () => {
    if (!lead.nome) {
      toast({ title: 'Erro', description: 'O nome é obrigatório', variant: 'destructive' });
      return;
    }

    setSaving(true);

    // Check for duplicate (by phone or email)
    if (lead.telefone || lead.email) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id, nome')
        .or(`telefone.eq.${lead.telefone},email.eq.${lead.email}`)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({
          title: 'Lead já existe!',
          description: `Este contato já está cadastrado como "${existing[0].nome}"`,
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase.from('leads').insert({
      nome: lead.nome,
      empresa: lead.empresa || null,
      cargo: lead.cargo || null,
      telefone: lead.telefone || null,
      email: lead.email || null,
      segmento: lead.segmento || null,
      localizacao: lead.localizacao || null,
      origem: lead.origem,
      observacoes: lead.observacoes || null,
      responsavel_id: user?.id,
      status: 'novo'
    });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar o lead', variant: 'destructive' });
    } else {
      toast({ title: 'Lead cadastrado!' });
      onOpenChange(false);
      setLead({
        nome: '',
        empresa: '',
        cargo: '',
        telefone: '',
        email: '',
        segmento: '',
        localizacao: '',
        origem: 'outbound',
        observacoes: ''
      });
      onLeadAdded();
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>Cadastre um novo lead no CRM</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome do contato"
                value={lead.nome}
                onChange={(e) => setLead({ ...lead, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                placeholder="Nome da empresa"
                value={lead.empresa}
                onChange={(e) => setLead({ ...lead, empresa: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                placeholder="Ex: Gerente, Dono..."
                value={lead.cargo}
                onChange={(e) => setLead({ ...lead, cargo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Input
                placeholder="Ex: Restaurante, Clínica..."
                value={lead.segmento}
                onChange={(e) => setLead({ ...lead, segmento: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="+55 11 99999-9999"
                value={lead.telefone}
                onChange={(e) => setLead({ ...lead, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                placeholder="email@empresa.com"
                type="email"
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                placeholder="Cidade, UF"
                value={lead.localizacao}
                onChange={(e) => setLead({ ...lead, localizacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={lead.origem}
                onValueChange={(v) => setLead({ ...lead, origem: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="pap">PAP</SelectItem>
                  <SelectItem value="trafego_pago">Tráfego Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre o lead..."
              value={lead.observacoes}
              onChange={(e) => setLead({ ...lead, observacoes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
