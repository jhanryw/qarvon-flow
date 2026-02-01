import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { MetricCard } from './MetricCard';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar, 
  Target, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Lead = Tables<'leads'>;
type Transaction = Tables<'transactions'>;

const pipelineStages = [
  { id: 'novo', label: 'Novo', color: 'bg-slate-500' },
  { id: 'contatado', label: 'Contatado', color: 'bg-blue-500' },
  { id: 'respondeu', label: 'Respondeu', color: 'bg-cyan-500' },
  { id: 'reuniao_marcada', label: 'Reunião', color: 'bg-emerald-500' },
  { id: 'proposta_enviada', label: 'Proposta', color: 'bg-amber-500' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-500' },
  { id: 'fechado', label: 'Fechado', color: 'bg-green-600' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-500' },
];

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [leadsResult, transactionsResult] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('data', { ascending: false })
    ]);

    if (leadsResult.data) setLeads(leadsResult.data);
    if (transactionsResult.data) setTransactions(transactionsResult.data);
    
    setLoading(false);
  };

  // Calculate metrics
  const totalEntradas = transactions.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = transactions.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;
  
  const leadsNovos = leads.filter(l => l.status === 'novo').length;
  const leadsFechados = leads.filter(l => l.status === 'fechado').length;
  const leadsTotal = leads.length;
  const taxaConversao = leadsTotal > 0 ? ((leadsFechados / leadsTotal) * 100).toFixed(1) : '0';
  
  const ltvMedio = leads.filter(l => l.ltv).reduce((acc, l) => acc + Number(l.ltv || 0), 0) / (leads.filter(l => l.ltv).length || 1);
  
  const reunioesAgendadas = leads.filter(l => l.status === 'reuniao_marcada').length;

  const leadsPerStage = pipelineStages.map(stage => ({
    ...stage,
    count: leads.filter(l => l.status === stage.id).length
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Receita Total" 
          value={`R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={0}
          icon={DollarSign}
          variant="primary"
        />
        <MetricCard 
          title="Saldo Atual" 
          value={`R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={0}
          icon={RefreshCw}
          variant={saldo >= 0 ? 'success' : 'warning'}
        />
        <MetricCard 
          title="Leads Novos" 
          value={leadsNovos}
          change={0}
          icon={Users}
        />
        <MetricCard 
          title="Taxa de Conversão" 
          value={`${taxaConversao}%`}
          change={0}
          icon={Target}
          variant="warning"
        />
      </div>

      {/* Financial + CRM Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-success">
                R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center text-success text-sm">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-destructive">
                R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center text-destructive text-sm">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">LTV Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">
                R$ {ltvMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center text-success text-sm">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reuniões Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{reunioesAgendadas}</span>
              <div className="flex items-center text-primary text-sm">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Funil de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {leadsPerStage.map((stage, index) => (
              <div 
                key={stage.id} 
                className="flex-1 flex flex-col items-center gap-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div 
                  className={`w-full ${stage.color} rounded-t-lg transition-all duration-500`}
                  style={{ 
                    height: `${Math.max(20, stage.count * 25)}px`,
                  }}
                />
                <div className="text-center">
                  <p className="text-lg font-bold">{stage.count}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[80px]">{stage.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leads.filter(l => l.status === 'reuniao_marcada').slice(0, 3).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma reunião agendada</p>
            ) : (
              leads.filter(l => l.status === 'reuniao_marcada').slice(0, 3).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{lead.nome}</p>
                    <p className="text-sm text-muted-foreground">{lead.empresa}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">
                      {lead.proximo_contato 
                        ? new Date(lead.proximo_contato).toLocaleDateString('pt-BR')
                        : 'A definir'
                      }
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leads Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum lead cadastrado</p>
            ) : (
              leads.slice(0, 3).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-medium">
                      {lead.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{lead.nome}</p>
                      <p className="text-sm text-muted-foreground">{lead.segmento || 'Sem segmento'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    pipelineStages.find(s => s.id === lead.status)?.color
                  } text-white`}>
                    {pipelineStages.find(s => s.id === lead.status)?.label}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
