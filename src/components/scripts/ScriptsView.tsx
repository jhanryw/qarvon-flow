import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Copy, 
  Check,
  Phone,
  MessageSquare,
  Video,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const scripts = {
  whatsapp: {
    abertura: `Olá [NOME]! Tudo bem? 👋

Sou [SEU NOME] da Qarvon, uma agência especializada em marketing digital para [SEGMENTO].

Vi o trabalho da [EMPRESA] e identifiquei algumas oportunidades de crescimento que gostaria de compartilhar.

Posso te mandar uma análise rápida do perfil de vocês?`,
    followUp: `Oi [NOME]! 😊

Passando para ver se conseguiu dar uma olhada na mensagem anterior.

Preparei uma análise do perfil da [EMPRESA] - em 2 minutos você consegue ver os pontos que podem melhorar.

Posso enviar?`,
    agendamento: `Perfeito, [NOME]! 🎯

Que tal marcarmos 15 minutos para eu te mostrar como podemos ajudar a [EMPRESA] a [BENEFÍCIO]?

Tenho disponibilidade:
📅 [DIA 1] às [HORÁRIO]
📅 [DIA 2] às [HORÁRIO]

Qual funciona melhor para você?`,
    posReuniao: `Olá [NOME]! 

Foi ótimo conversar com você hoje! 🙌

Conforme combinamos, seguem os materiais:
📎 Proposta comercial
📎 Cases de clientes do [SEGMENTO]

Qualquer dúvida, estou à disposição.

Posso te ligar [DIA] para conversarmos sobre a proposta?`
  },
  ligacao: {
    abertura: `"Olá, [NOME]? Tudo bem?

Aqui é [SEU NOME] da Qarvon. 

Estou ligando porque somos especialistas em marketing digital para [SEGMENTO] e vi algumas oportunidades interessantes no perfil da [EMPRESA].

Você tem 2 minutinhos para eu te explicar?"`,
    qualificacao: `"Legal! Me conta um pouco... 

- Vocês já fazem algum trabalho de marketing digital hoje?
- Quem cuida dessa parte atualmente?
- Qual o maior desafio que vocês enfrentam para atrair clientes online?
- Se você pudesse melhorar uma coisa no marketing de vocês, o que seria?"`,
    apresentacao: `"Entendi! Olha, a Qarvon é especializada exatamente nisso.

Nós ajudamos empresas de [SEGMENTO] a:
1. [BENEFÍCIO 1 relacionado à dor]
2. [BENEFÍCIO 2 relacionado à dor]
3. [BENEFÍCIO 3 relacionado à dor]

Temos clientes como [CASE] que conseguiram [RESULTADO].

Faz sentido para você?"`,
    fechamento: `"Ótimo! O que eu proponho é o seguinte:

Vamos marcar uma reunião de 30 minutos para eu te apresentar uma análise completa e uma proposta personalizada para a [EMPRESA].

Você tem agenda [DIA] às [HORÁRIO] ou [DIA] às [HORÁRIO]?

Perfeito! Vou te mandar um convite por e-mail e WhatsApp. Pode confirmar?"`
  },
  reuniao: {
    abertura: `"[NOME], muito prazer! Obrigado por separar esse tempo.

Antes de começar, deixa eu entender melhor o contexto:
- Me conta um pouco sobre a [EMPRESA]
- Quais são as principais fontes de cliente de vocês hoje?
- Vocês já fazem algum trabalho de marketing digital?"`,
    diagnostico: `"Entendi! Baseado no que você me contou, identifiquei 3 pontos principais:

1. [OPORTUNIDADE 1] - isso está custando [IMPACTO]
2. [OPORTUNIDADE 2] - vocês estão deixando de [IMPACTO]
3. [OPORTUNIDADE 3] - com isso poderiam [BENEFÍCIO]

Faz sentido para você?"`,
    solucao: `"Para resolver isso, a gente estruturou um plano em 3 frentes:

🎯 [FRENTE 1]: [explicação breve]
🎯 [FRENTE 2]: [explicação breve]  
🎯 [FRENTE 3]: [explicação breve]

Isso é exatamente o que fizemos com [CASE] e eles conseguiram [RESULTADO] em [TEMPO]."`,
    proposta: `"Beleza! Então a proposta para a [EMPRESA] é:

📦 Plano [NOME DO PLANO]
- [ENTREGÁVEL 1]
- [ENTREGÁVEL 2]
- [ENTREGÁVEL 3]

💰 Investimento: R$ [VALOR]/mês

🎁 Se fecharmos até [DATA], incluímos [BÔNUS] sem custo adicional.

O que você acha?"`
  }
};

export function ScriptsView() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const ScriptCard = ({ title, content, id }: { title: string; content: string; id: string }) => (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => copyToClipboard(content, id)}
          >
            {copiedId === id ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-background rounded-lg p-4 border border-border/50">
          <pre className="whitespace-pre-wrap text-sm font-sans">{content}</pre>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Scripts de Vendas
          </h2>
          <p className="text-muted-foreground">
            Roteiros completos para cada etapa do processo
          </p>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="ligacao" className="gap-2">
            <Phone className="w-4 h-4" />
            Ligação
          </TabsTrigger>
          <TabsTrigger value="reuniao" className="gap-2">
            <Video className="w-4 h-4" />
            Reunião
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <ScriptCard 
              title="1️⃣ Abertura / Primeiro Contato" 
              content={scripts.whatsapp.abertura}
              id="wpp-abertura"
            />
            <ScriptCard 
              title="2️⃣ Follow-up" 
              content={scripts.whatsapp.followUp}
              id="wpp-followup"
            />
            <ScriptCard 
              title="3️⃣ Agendamento de Reunião" 
              content={scripts.whatsapp.agendamento}
              id="wpp-agendamento"
            />
            <ScriptCard 
              title="4️⃣ Pós-Reunião" 
              content={scripts.whatsapp.posReuniao}
              id="wpp-pos"
            />
          </div>

          {/* Flow Visualization */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">📊 Fluxo WhatsApp</h4>
              <div className="flex items-center justify-between overflow-x-auto">
                {['Abertura', 'Resposta?', 'Follow-up', 'Interesse?', 'Agendamento', 'Reunião', 'Pós-Reunião'].map((step, i, arr) => (
                  <div key={step} className="flex items-center">
                    <Badge variant={i % 2 === 0 ? 'default' : 'outline'} className="whitespace-nowrap">
                      {step}
                    </Badge>
                    {i < arr.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ligacao" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <ScriptCard 
              title="1️⃣ Abertura" 
              content={scripts.ligacao.abertura}
              id="lig-abertura"
            />
            <ScriptCard 
              title="2️⃣ Qualificação" 
              content={scripts.ligacao.qualificacao}
              id="lig-qualificacao"
            />
            <ScriptCard 
              title="3️⃣ Apresentação" 
              content={scripts.ligacao.apresentacao}
              id="lig-apresentacao"
            />
            <ScriptCard 
              title="4️⃣ Fechamento" 
              content={scripts.ligacao.fechamento}
              id="lig-fechamento"
            />
          </div>
        </TabsContent>

        <TabsContent value="reuniao" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <ScriptCard 
              title="1️⃣ Abertura & Rapport" 
              content={scripts.reuniao.abertura}
              id="reu-abertura"
            />
            <ScriptCard 
              title="2️⃣ Diagnóstico" 
              content={scripts.reuniao.diagnostico}
              id="reu-diagnostico"
            />
            <ScriptCard 
              title="3️⃣ Apresentação da Solução" 
              content={scripts.reuniao.solucao}
              id="reu-solucao"
            />
            <ScriptCard 
              title="4️⃣ Proposta & Fechamento" 
              content={scripts.reuniao.proposta}
              id="reu-proposta"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔧 Variáveis para Personalização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['[NOME]', '[EMPRESA]', '[SEGMENTO]', '[SEU NOME]', '[BENEFÍCIO]', '[DIA]', '[HORÁRIO]', '[CASE]', '[RESULTADO]', '[VALOR]'].map((variable) => (
              <code key={variable} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                {variable}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}