import { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

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

const categoriasEntrada = ['Receita Recorrente', 'Receita Pontual'];
const categoriasSaida = ['Gasto Operacional', 'Pessoas', 'Imposto', 'Pró-labore', 'Cartão da Empresa'];

const COLORS_ENTRADA = ['hsl(var(--success))', 'hsl(142, 76%, 46%)'];
const COLORS_SAIDA = ['hsl(var(--destructive))', 'hsl(0, 84%, 50%)', 'hsl(25, 95%, 53%)', 'hsl(45, 93%, 47%)', 'hsl(280, 68%, 51%)'];

// Helper to get first day of current month
const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

// Helper to get last day of current month
const getLastDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
};

export function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters - default to current month
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    
    const [leadsResult, transactionsResult, allTransactionsResult] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*')
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: false }),
      supabase.from('transactions').select('*').order('data', { ascending: true })
    ]);

    if (leadsResult.data) setLeads(leadsResult.data);
    if (transactionsResult.data) setTransactions(transactionsResult.data);
    if (allTransactionsResult.data) setAllTransactions(allTransactionsResult.data);
    
    setLoading(false);
  };

  // Calculate metrics for filtered period
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

  // Monthly data for bar chart (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; entradas: number; saidas: number }> = {};
    
    allTransactions.forEach(t => {
      const date = new Date(t.data);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!months[monthKey]) {
        months[monthKey] = { month: monthLabel, entradas: 0, saidas: 0 };
      }
      
      if (t.tipo === 'entrada') {
        months[monthKey].entradas += Number(t.valor);
      } else {
        months[monthKey].saidas += Number(t.valor);
      }
    });
    
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, data]) => data);
  }, [allTransactions]);

  // Category breakdown for pie charts (filtered period)
  const categoryBreakdown = useMemo(() => {
    const entradas: { name: string; value: number }[] = categoriasEntrada.map(cat => ({
      name: cat,
      value: transactions.filter(t => t.tipo === 'entrada' && t.categoria === cat).reduce((acc, t) => acc + Number(t.valor), 0)
    })).filter(c => c.value > 0);

    const saidas: { name: string; value: number }[] = categoriasSaida.map(cat => ({
      name: cat,
      value: transactions.filter(t => t.tipo === 'saida' && t.categoria === cat).reduce((acc, t) => acc + Number(t.valor), 0)
    })).filter(c => c.value > 0);

    return { entradas, saidas };
  }, [transactions]);

  const chartConfig = {
    entradas: { label: 'Entradas', color: 'hsl(var(--success))' },
    saidas: { label: 'Saídas', color: 'hsl(var(--destructive))' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Date Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-0 p-0 h-auto w-auto bg-transparent"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-0 p-0 h-auto w-auto bg-transparent"
          />
        </div>
      </div>

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Entradas vs Saídas por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma transação registrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Pie Charts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Balanço por Categoria (Período)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 h-[300px]">
              {/* Entradas Pie */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-success mb-2">Entradas</p>
                {categoryBreakdown.entradas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.entradas}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryBreakdown.entradas.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_ENTRADA[index % COLORS_ENTRADA.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    Sem dados
                  </div>
                )}
                <div className="space-y-1 text-xs">
                  {categoryBreakdown.entradas.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_ENTRADA[i % COLORS_ENTRADA.length] }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saídas Pie */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-destructive mb-2">Saídas</p>
                {categoryBreakdown.saidas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.saidas}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryBreakdown.saidas.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_SAIDA[index % COLORS_SAIDA.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    Sem dados
                  </div>
                )}
                <div className="space-y-1 text-xs">
                  {categoryBreakdown.saidas.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_SAIDA[i % COLORS_SAIDA.length] }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                  ))}
                </div>
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
