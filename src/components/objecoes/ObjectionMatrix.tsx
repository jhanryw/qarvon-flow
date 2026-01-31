import { useState } from 'react';
import { objections } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Copy, 
  Check,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function ObjectionMatrix() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'Concorrência': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Gatekeeping': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Preço': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Procrastinação': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted';
    }
  };

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'Concorrência': return '🏢';
      case 'Gatekeeping': return '🚪';
      case 'Preço': return '💰';
      case 'Procrastinação': return '⏰';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Matriz de Objeções
          </h2>
          <p className="text-muted-foreground">
            Respostas prontas para as objeções mais comuns
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['Concorrência', 'Gatekeeping', 'Preço', 'Procrastinação'].map((cat) => (
          <Card key={cat} className="bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">{getCategoryIcon(cat)}</span>
              <div>
                <p className="text-sm text-muted-foreground">{cat}</p>
                <p className="text-lg font-bold">
                  {objections.filter(o => o.categoria === cat).length}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Objections List */}
      <div className="space-y-4">
        <Accordion type="multiple" className="space-y-3">
          {objections.map((objection, index) => (
            <AccordionItem 
              key={objection.id} 
              value={objection.id}
              className="border rounded-xl bg-card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-4 text-left">
                  <span className="text-2xl">{getCategoryIcon(objection.categoria)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{objection.titulo}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getCategoryColor(objection.categoria))}
                      >
                        {objection.categoria}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{objection.descricao}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 pt-2">
                  {/* Response */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Resposta Sugerida
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(objection.resposta, objection.id)}
                        className="gap-2"
                      >
                        {copiedId === objection.id ? (
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
                    <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {objection.resposta}
                      </pre>
                    </div>
                  </div>

                  {/* Next Action */}
                  {objection.acaoSeguinte && (
                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <ArrowRight className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-primary mb-1">Próxima Ação</h4>
                        <p className="text-sm text-muted-foreground">{objection.acaoSeguinte}</p>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Pro Tips */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Dicas para Lidar com Objeções
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong className="text-primary">1. Não discuta:</strong> Concorde parcialmente antes de apresentar sua perspectiva
              </p>
              <p className="text-sm">
                <strong className="text-primary">2. Faça perguntas:</strong> Entenda a objeção real antes de responder
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <strong className="text-primary">3. Use histórias:</strong> Cases de clientes similares são mais convincentes
              </p>
              <p className="text-sm">
                <strong className="text-primary">4. Mantenha a porta aberta:</strong> Se não for agora, deixe o lead na nutrição
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}