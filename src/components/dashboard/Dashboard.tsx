import { MetricCard } from './MetricCard';
import { mockMetrics, mockLeads, pipelineStages } from '@/data/mockData';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar, 
  Target, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Dashboard() {
  const leadsPerStage = pipelineStages.map(stage => ({
    ...stage,
    count: mockLeads.filter(l => l.status === stage.id).length
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Receita Total" 
          value={`R$ ${mockMetrics.receitaTotal.toLocaleString('pt-BR')}`}
          change={12.5}
          icon={DollarSign}
          variant="primary"
        />
        <MetricCard 
          title="Receita Recorrente" 
          value={`R$ ${mockMetrics.receitaRecorrente.toLocaleString('pt-BR')}`}
          change={8.3}
          icon={RefreshCw}
          variant="success"
        />
        <MetricCard 
          title="Leads Novos" 
          value={mockMetrics.leadsNovos}
          change={23}
          icon={Users}
        />
        <MetricCard 
          title="Taxa de Conversão" 
          value={`${mockMetrics.taxaConversao}%`}
          change={-2.1}
          icon={Target}
          variant="warning"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">LTV Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">R$ {mockMetrics.ltv.toLocaleString('pt-BR')}</span>
              <div className="flex items-center text-success text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>15%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">R$ {mockMetrics.cac.toLocaleString('pt-BR')}</span>
              <div className="flex items-center text-success text-sm">
                <ArrowDownRight className="w-4 h-4" />
                <span>8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{mockMetrics.churn}%</span>
              <div className="flex items-center text-destructive text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>0.5%</span>
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
                  className={`w-full ${stage.color} rounded-t-lg transition-all duration-500 animate-slide-up`}
                  style={{ 
                    height: `${Math.max(20, stage.count * 30)}px`,
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
            {mockLeads.filter(l => l.status === 'reuniao_marcada').slice(0, 3).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">{lead.nome}</p>
                  <p className="text-sm text-muted-foreground">{lead.empresa}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">
                    {lead.proximoContato?.toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">{lead.responsavel}</p>
                </div>
              </div>
            ))}
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
            {mockLeads.slice(0, 3).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-medium">
                    {lead.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{lead.nome}</p>
                    <p className="text-sm text-muted-foreground">{lead.segmento}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  pipelineStages.find(s => s.id === lead.status)?.color
                } text-white`}>
                  {pipelineStages.find(s => s.id === lead.status)?.label}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}