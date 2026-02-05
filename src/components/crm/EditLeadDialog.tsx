import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
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

type Lead = Tables<'leads'>;

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onLeadUpdated: () => void;
}

export function EditLeadDialog({ open, onOpenChange, lead, onLeadUpdated }: EditLeadDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    cargo: '',
    telefone: '',
    email: '',
    segmento: '',
    localizacao: '',
    origem: 'outbound' as 'inbound' | 'outbound' | 'indicacao' | 'pap' | 'trafego_pago',
    observacoes: '',
    ltv: '',
    reuniao_notas: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        nome: lead.nome || '',
        empresa: lead.empresa || '',
        cargo: lead.cargo || '',
        telefone: lead.telefone || '',
        email: lead.email || '',
        segmento: lead.segmento || '',
        localizacao: lead.localizacao || '',
        origem: lead.origem,
        observacoes: lead.observacoes || '',
        ltv: lead.ltv ? String(lead.ltv) : '',
        reuniao_notas: lead.reuniao_notas || ''
      });
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead || !formData.nome) {
      toast({ title: 'Erro', description: 'O nome é obrigatório', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('leads')
      .update({
        nome: formData.nome,
        empresa: formData.empresa || null,
        cargo: formData.cargo || null,
        telefone: formData.telefone || null,
        email: formData.email || null,
        segmento: formData.segmento || null,
        localizacao: formData.localizacao || null,
        origem: formData.origem,
        observacoes: formData.observacoes || null,
        ltv: formData.ltv ? parseFloat(formData.ltv) : null,
        reuniao_notas: formData.reuniao_notas || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o lead', variant: 'destructive' });
    } else {
      toast({ title: 'Lead atualizado!' });
      onOpenChange(false);
      onLeadUpdated();
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
          <DialogDescription>Atualize as informações do lead</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome do contato"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                placeholder="Nome da empresa"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                placeholder="Ex: Gerente, Dono..."
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Input
                placeholder="Ex: Restaurante, Clínica..."
                value={formData.segmento}
                onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="+55 11 99999-9999"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                placeholder="email@empresa.com"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input
                placeholder="Cidade, UF"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={formData.origem}
                onValueChange={(v) => setFormData({ ...formData, origem: v as any })}
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
            <Label>Valor de Negociação (LTV)</Label>
            <Input
              placeholder="Ex: 5000"
              type="number"
              value={formData.ltv}
              onChange={(e) => setFormData({ ...formData, ltv: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre o lead..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas da Reunião</Label>
            <Textarea
              placeholder="Anotações de reuniões realizadas..."
              value={formData.reuniao_notas}
              onChange={(e) => setFormData({ ...formData, reuniao_notas: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
