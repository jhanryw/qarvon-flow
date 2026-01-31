import { Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const eventos = [
  { id: '1', titulo: 'Reunião - Tech Solutions', data: '2025-02-01', hora: '10:00', tipo: 'reuniao', responsavel: 'Carlos' },
  { id: '2', titulo: 'Follow-up Boutique Elegance', data: '2025-02-01', hora: '14:00', tipo: 'tarefa', responsavel: 'Ana' },
  { id: '3', titulo: 'Onboarding Clínica Bella', data: '2025-02-02', hora: '09:00', tipo: 'reuniao', responsavel: 'Carlos' },
  { id: '4', titulo: 'Análise de Campanhas', data: '2025-02-03', hora: '11:00', tipo: 'tarefa', responsavel: 'João' },
  { id: '5', titulo: 'Reunião Interna - Equipe', data: '2025-02-03', hora: '16:00', tipo: 'interno', responsavel: 'Admin' },
];

export function AgendaView() {
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'reuniao': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'tarefa': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'interno': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Agenda
          </h2>
          <p className="text-muted-foreground">Próximos compromissos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventos.map((evento) => (
              <div key={evento.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{evento.titulo}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {evento.data} às {evento.hora}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {evento.responsavel}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={getTipoColor(evento.tipo)}>
                  {evento.tipo}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
              <span className="text-sm">Reuniões agendadas</span>
              <span className="font-bold text-blue-400">3</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
              <span className="text-sm">Tarefas pendentes</span>
              <span className="font-bold text-orange-400">5</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <span className="text-sm">Follow-ups programados</span>
              <span className="font-bold text-green-400">8</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
              <span className="text-sm">Eventos internos</span>
              <span className="font-bold text-purple-400">2</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}