import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  User, 
  MessageSquare,
  Calendar,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  Loader2,
  Trash2,
  Edit,
  Instagram
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddLeadDialog } from './AddLeadDialog';
import { EditLeadDialog } from './EditLeadDialog';
import { useToast } from '@/hooks/use-toast';

type Lead = Tables<'leads'> & { criado_via?: string };
type LeadStatus = Lead['status'];

const pipelineStages = [
  { id: 'novo', label: 'Novo', color: 'bg-slate-500' },
  { id: 'contatado', label: 'Contatado', color: 'bg-blue-500' },
  { id: 'respondeu', label: 'Respondeu', color: 'bg-cyan-500' },
  { id: 'reuniao_marcada', label: 'Reunião Marcada', color: 'bg-emerald-500' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', color: 'bg-amber-500' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-500' },
  { id: 'fechado', label: 'Fechado', color: 'bg-green-600' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-500' },
  { id: 'nutricao', label: 'Nutrição', color: 'bg-purple-500' },
];

const origemLabels: Record<string, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  indicacao: 'Indicação',
  pap: 'PAP',
  trafego_pago: 'Tráfego Pago'
};

const criadoViaLabels: Record<string, { label: string; icon: typeof MessageSquare; className: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, className: 'bg-green-500/20 text-green-400' },
  instagram: { label: 'Instagram', icon: Instagram, className: 'bg-pink-500/20 text-pink-400' },
  manual: { label: 'Manual', icon: Plus, className: 'bg-slate-500/20 text-slate-400' },
};

export function CRMPipeline() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadToDelete.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o lead', variant: 'destructive' });
    } else {
      toast({ title: 'Lead excluído' });
      setSelectedLead(null);
      fetchLeads();
    }
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  };

  const canDeleteLead = (lead: Lead) => {
    // Can only delete manually created leads
    return (lead as any).criado_via === 'manual' && isAdmin();
  };

  const filteredLeads = leads.filter(lead => 
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.empresa?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lead.segmento?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLeadsByStatus = (status: LeadStatus) => 
    filteredLeads.filter(lead => lead.status === status);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: LeadStatus) => {
    if (draggedLead) {
      // Optimistic update
      setLeads(prev => 
        prev.map(lead => 
          lead.id === draggedLead.id 
            ? { ...lead, status, ultimo_contato: new Date().toISOString() } 
            : lead
        )
      );

      // Update in database
      await supabase
        .from('leads')
        .update({ status, ultimo_contato: new Date().toISOString() })
        .eq('id', draggedLead.id);

      setDraggedLead(null);
    }
  };

  const getOrigemBadge = (origem: string) => {
    const colors: Record<string, string> = {
      inbound: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      outbound: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      indicacao: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      pap: 'bg-green-500/20 text-green-400 border-green-500/30',
      trafego_pago: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    };
    return colors[origem] || 'bg-muted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
        <Button className="gradient-primary text-white" onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* Pipeline */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {pipelineStages.map((stage) => (
            <div 
              key={stage.id}
              className="w-72 flex flex-col bg-muted/30 rounded-xl"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id as LeadStatus)}
            >
              {/* Stage Header */}
              <div className="p-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                    <h3 className="font-semibold text-sm">{stage.label}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getLeadsByStatus(stage.id as LeadStatus).length}
                  </Badge>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {getLeadsByStatus(stage.id as LeadStatus).map((lead) => (
                  <Card 
                    key={lead.id}
                    className={cn(
                      "cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4",
                      stage.color.replace('bg-', 'border-l-'),
                      draggedLead?.id === lead.id && "opacity-50"
                    )}
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{lead.nome}</p>
                          <p className="text-xs text-muted-foreground">{lead.empresa}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {/* Canal badge (whatsapp/instagram) */}
                        {lead.criado_via && criadoViaLabels[lead.criado_via] && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] px-1.5 flex items-center gap-1", criadoViaLabels[lead.criado_via].className)}
                          >
                            {(() => {
                              const CanalIcon = criadoViaLabels[lead.criado_via].icon;
                              return <CanalIcon className="w-2.5 h-2.5" />;
                            })()}
                            {criadoViaLabels[lead.criado_via].label}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5", getOrigemBadge(lead.origem))}
                        >
                          {origemLabels[lead.origem] || lead.origem}
                        </Badge>
                        {lead.cargo && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {lead.cargo}
                          </Badge>
                        )}
                      </div>

                      {lead.localizacao && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{lead.localizacao}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {lead.ultimo_contato 
                            ? new Date(lead.ultimo_contato).toLocaleDateString('pt-BR')
                            : new Date(lead.created_at).toLocaleDateString('pt-BR')
                          }
                        </span>
                      </div>

                      {lead.ltv && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground">
                            LTV: <span className="text-primary font-semibold">R$ {Number(lead.ltv).toLocaleString('pt-BR')}</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white text-lg font-bold">
                    {selectedLead.nome.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedLead.nome}</h2>
                    <p className="text-muted-foreground font-normal">{selectedLead.empresa}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  {selectedLead.cargo && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.cargo}</span>
                    </div>
                  )}
                  {selectedLead.telefone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.telefone}</span>
                    </div>
                  )}
                  {selectedLead.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.email}</span>
                    </div>
                  )}
                  {selectedLead.segmento && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.segmento}</span>
                    </div>
                  )}
                  {selectedLead.localizacao && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.localizacao}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={cn(
                      "text-white",
                      pipelineStages.find(s => s.id === selectedLead.status)?.color
                    )}>
                      {pipelineStages.find(s => s.id === selectedLead.status)?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Origem</p>
                    <Badge variant="outline" className={getOrigemBadge(selectedLead.origem)}>
                      {origemLabels[selectedLead.origem] || selectedLead.origem}
                    </Badge>
                  </div>
                  {selectedLead.ltv && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">LTV</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {Number(selectedLead.ltv).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedLead.observacoes && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Observações</p>
                  <p className="text-sm">{selectedLead.observacoes}</p>
                </div>
              )}

              {selectedLead.reuniao_notas && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Notas da Reunião
                  </p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedLead.reuniao_notas}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setLeadToEdit(selectedLead);
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar
                </Button>
                <Button className="flex-1 gradient-primary text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Reunião
                </Button>
                {canDeleteLead(selectedLead) && (
                  <Button 
                    variant="outline" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setLeadToDelete(selectedLead);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{leadToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddLeadDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onLeadAdded={fetchLeads}
      />

      <EditLeadDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        lead={leadToEdit}
        onLeadUpdated={() => {
          fetchLeads();
          setSelectedLead(null);
        }}
      />
    </div>
  );
}
