import { useState } from 'react';
import { cadenceSteps } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Copy, 
  Check,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export function CadenceFlow() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case 'whatsapp': return MessageSquare;
      case 'ligacao': return Phone;
      case 'email': return Mail;
      default: return MessageSquare;
    }
  };

  const getChannelColor = (canal: string) => {
    switch (canal) {
      case 'whatsapp': return 'bg-green-500';
      case 'ligacao': return 'bg-blue-500';
      case 'email': return 'bg-purple-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Fluxo de Cadência
          </h2>
          <p className="text-muted-foreground">
            Roteiros de abordagem para loja e decisor
          </p>
        </div>
      </div>

      <Tabs defaultValue="loja" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="loja" className="gap-2">
            🏪 Abordagem Loja
          </TabsTrigger>
          <TabsTrigger value="decisor" className="gap-2">
            👔 Abordagem Decisor
          </TabsTrigger>
        </TabsList>

        {cadenceSteps.map((cadence) => (
          <TabsContent key={cadence.id} value={cadence.tipo} className="space-y-4">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{cadence.nome}</span>
                  <Badge variant="outline" className="text-primary border-primary">
                    {cadence.steps.length} mensagens
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {cadence.steps.map((step, index) => {
                      const Icon = getChannelIcon(step.canal);
                      const isLast = index === cadence.steps.length - 1;

                      return (
                        <div key={step.id} className="relative pl-16 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                          {/* Timeline Node */}
                          <div className={cn(
                            "absolute left-4 w-5 h-5 rounded-full flex items-center justify-center",
                            getChannelColor(step.canal)
                          )}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>

                          {/* Arrow */}
                          {!isLast && (
                            <ChevronRight className="absolute left-3.5 top-8 w-4 h-4 text-muted-foreground rotate-90" />
                          )}

                          {/* Content */}
                          <Card className="bg-muted/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    Dia {step.dia}
                                  </Badge>
                                  <Badge variant="outline" className={cn(
                                    step.canal === 'whatsapp' && 'text-green-500 border-green-500',
                                    step.canal === 'ligacao' && 'text-blue-500 border-blue-500',
                                    step.canal === 'email' && 'text-purple-500 border-purple-500',
                                  )}>
                                    {step.canal === 'whatsapp' && 'WhatsApp'}
                                    {step.canal === 'ligacao' && 'Ligação'}
                                    {step.canal === 'email' && 'E-mail'}
                                  </Badge>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(step.mensagem, step.id)}
                                  className="gap-2"
                                >
                                  {copiedId === step.id ? (
                                    <>
                                      <Check className="w-4 h-4 text-green-500" />
                                      Copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4" />
                                      Copiar
                                    </>
                                  )}
                                </Button>
                              </div>

                              <div className="bg-background rounded-lg p-4 border border-border/50">
                                <pre className="whitespace-pre-wrap text-sm font-sans">
                                  {step.mensagem}
                                </pre>
                              </div>

                              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>💡 Variáveis:</span>
                                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">[NOME]</code>
                                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">[EMPRESA]</code>
                                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">[SEGMENTO]</code>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-primary mb-2">💡 Dicas para {cadence.tipo === 'loja' ? 'Abordagem Loja' : 'Abordagem Decisor'}</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {cadence.tipo === 'loja' ? (
                    <>
                      <li>• Seja breve e objetivo - funcionários estão ocupados</li>
                      <li>• Não tente vender para quem atende - foque em conseguir o contato do decisor</li>
                      <li>• Se não conseguir o contato, tente descobrir o nome do decisor</li>
                    </>
                  ) : (
                    <>
                      <li>• Personalize a mensagem com o nome e contexto da empresa</li>
                      <li>• Mencione algo específico que você viu sobre o negócio</li>
                      <li>• Tenha um único CTA claro por mensagem</li>
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}