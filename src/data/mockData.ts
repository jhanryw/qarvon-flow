import { Lead, Cadence, Objection, DashboardMetrics } from '@/types';

export const mockLeads: Lead[] = [
  {
    id: '1',
    nome: 'João Silva',
    empresa: 'Tech Solutions LTDA',
    cargo: 'CEO',
    telefone: '(11) 99999-9999',
    email: 'joao@techsolutions.com',
    segmento: 'Tecnologia',
    localizacao: 'São Paulo, SP',
    status: 'reuniao_marcada',
    origem: 'outbound',
    tipoContato: 'decisor',
    responsavel: 'Carlos',
    dataCriacao: new Date('2025-01-15'),
    ultimoContato: new Date('2025-01-29'),
    proximoContato: new Date('2025-02-01'),
    observacoes: 'Interessado em gestão de redes sociais',
    historico: [
      { id: '1', data: new Date('2025-01-15'), tipo: 'whatsapp', mensagem: 'Primeira abordagem' },
      { id: '2', data: new Date('2025-01-18'), tipo: 'whatsapp', mensagem: 'Follow-up', resposta: 'Pode me ligar amanhã' },
    ],
    ltv: 24000,
  },
  {
    id: '2',
    nome: 'Maria Santos',
    empresa: 'Boutique Elegance',
    cargo: 'Proprietária',
    telefone: '(21) 98888-8888',
    email: 'maria@boutiqueelegance.com',
    segmento: 'Moda',
    localizacao: 'Rio de Janeiro, RJ',
    status: 'proposta_enviada',
    origem: 'inbound',
    tipoContato: 'decisor',
    responsavel: 'Ana',
    dataCriacao: new Date('2025-01-20'),
    ultimoContato: new Date('2025-01-28'),
    observacoes: 'Veio pelo Instagram',
    historico: [],
    ltv: 18000,
  },
  {
    id: '3',
    nome: 'Pedro Mendes',
    empresa: 'Restaurante Sabor & Arte',
    cargo: 'Gerente',
    telefone: '(31) 97777-7777',
    email: 'pedro@saborarte.com',
    segmento: 'Alimentação',
    localizacao: 'Belo Horizonte, MG',
    status: 'contatado',
    origem: 'outbound',
    tipoContato: 'loja',
    responsavel: 'Carlos',
    dataCriacao: new Date('2025-01-25'),
    ultimoContato: new Date('2025-01-27'),
    observacoes: 'Número da loja, precisa pegar decisor',
    historico: [],
  },
  {
    id: '4',
    nome: 'Fernanda Lima',
    empresa: 'Studio Fitness Pro',
    cargo: 'Dona',
    telefone: '(41) 96666-6666',
    email: 'fernanda@fitnesspro.com',
    segmento: 'Saúde e Bem-estar',
    localizacao: 'Curitiba, PR',
    status: 'nutricao',
    origem: 'indicacao',
    tipoContato: 'decisor',
    responsavel: 'Ana',
    dataCriacao: new Date('2025-01-10'),
    ultimoContato: new Date('2025-01-20'),
    observacoes: 'Já tem agência, mandou para nutrição',
    historico: [],
  },
  {
    id: '5',
    nome: 'Ricardo Oliveira',
    empresa: 'Construtora Horizonte',
    cargo: 'Diretor Comercial',
    telefone: '(51) 95555-5555',
    email: 'ricardo@horizonteconstrutora.com',
    segmento: 'Construção Civil',
    localizacao: 'Porto Alegre, RS',
    status: 'novo',
    origem: 'pap',
    tipoContato: 'decisor',
    responsavel: 'Carlos',
    dataCriacao: new Date('2025-01-30'),
    ultimoContato: new Date('2025-01-30'),
    observacoes: 'Prospectado presencialmente',
    historico: [],
  },
  {
    id: '6',
    nome: 'Camila Rocha',
    empresa: 'Clínica Estética Bella',
    cargo: 'Proprietária',
    telefone: '(11) 94444-4444',
    email: 'camila@clinicabella.com',
    segmento: 'Saúde e Estética',
    localizacao: 'São Paulo, SP',
    status: 'fechado',
    origem: 'trafego_pago',
    tipoContato: 'decisor',
    responsavel: 'Ana',
    dataCriacao: new Date('2025-01-05'),
    ultimoContato: new Date('2025-01-25'),
    observacoes: 'Cliente fechado! Plano Premium',
    historico: [],
    ltv: 36000,
    reuniaoNotas: 'Reunião excelente, fechou na hora. Interesse em tráfego + social.',
  },
];

export const cadenceSteps: Cadence[] = [
  {
    id: '1',
    nome: 'Cadência Loja',
    tipo: 'loja',
    steps: [
      {
        id: '1',
        dia: 1,
        canal: 'whatsapp',
        tipo: 'loja',
        mensagem: `Olá! Tudo bem? 👋

Sou [SEU NOME] da Qarvon, uma agência especializada em marketing digital para [SEGMENTO].

Estou entrando em contato porque vi o trabalho de vocês e acredito que podemos ajudar a [BENEFÍCIO ESPECÍFICO].

Poderia me passar o contato do responsável pelo marketing?`
      },
      {
        id: '2',
        dia: 3,
        canal: 'whatsapp',
        tipo: 'loja',
        mensagem: `Oi! Passando aqui novamente 😊

Vocês conseguiram falar com o responsável sobre nossa proposta?

Temos alguns cases de [SEGMENTO] que tenho certeza que seriam interessantes para vocês verem.`
      },
    ]
  },
  {
    id: '2',
    nome: 'Cadência Decisor',
    tipo: 'decisor',
    steps: [
      {
        id: '1',
        dia: 1,
        canal: 'whatsapp',
        tipo: 'decisor',
        mensagem: `Olá [NOME]! Tudo bem? 👋

Sou [SEU NOME] da Qarvon. Somos uma agência especializada em resultados para [SEGMENTO].

Vi o trabalho da [EMPRESA] e identifiquei algumas oportunidades de crescimento no digital que gostaria de compartilhar com você.

Podemos marcar 15 minutos essa semana para eu te mostrar?`
      },
      {
        id: '2',
        dia: 3,
        canal: 'whatsapp',
        tipo: 'decisor',
        mensagem: `Oi [NOME]! 

Passando para ver se conseguiu dar uma olhada na minha mensagem anterior.

Preparei uma análise rápida do perfil da [EMPRESA] - posso te enviar?`
      },
      {
        id: '3',
        dia: 7,
        canal: 'whatsapp',
        tipo: 'decisor',
        mensagem: `[NOME], última tentativa por aqui! 

Sei que a rotina é corrida, mas tenho certeza que 15 minutos comigo podem trazer insights valiosos para a [EMPRESA].

Se não for o momento, sem problemas - me avisa que coloco você na nossa lista de conteúdos exclusivos sobre [SEGMENTO]. 📊`
      },
    ]
  }
];

export const objections: Objection[] = [
  {
    id: '1',
    titulo: 'Já tenho agência',
    descricao: 'O lead menciona que já trabalha com outra agência de marketing',
    resposta: `Compreensível! Muitos dos nossos melhores clientes vieram de outras agências.

Posso perguntar: você está 100% satisfeito com os resultados atuais?

Se não for o momento de trocar, posso te adicionar na nossa lista de conteúdos exclusivos - assim você fica por dentro das estratégias que estão funcionando no mercado.

O que acha?`,
    categoria: 'Concorrência',
    acaoSeguinte: 'Mover para aba de Nutrição - enviar conteúdo semanal'
  },
  {
    id: '2',
    titulo: 'A dona vai entrar em contato',
    descricao: 'O atendente diz que vai repassar para o decisor',
    resposta: `Perfeito! Agradeço muito 🙏

Para facilitar, posso enviar um resumo rápido por aqui mesmo? Assim a [DONA/DONO] já tem as informações principais.

Qual o melhor horário para eu retornar e confirmar se ela recebeu?`,
    categoria: 'Gatekeeping',
    acaoSeguinte: 'Agendar follow-up em 2 dias - Se não responder, tentar canal direto'
  },
  {
    id: '3',
    titulo: 'Vou enviar o contato do responsável',
    descricao: 'Promete enviar o contato mas não envia',
    resposta: `Oi! Tudo bem? 

Passando aqui para ver se conseguiu o contato do responsável 😊

Se preferir, posso entrar em contato diretamente pelo perfil da empresa - qual seria o melhor caminho?`,
    categoria: 'Gatekeeping',
    acaoSeguinte: 'Follow-up em 2 dias. Se não responder, buscar decisor no LinkedIn/Instagram'
  },
  {
    id: '4',
    titulo: 'Está caro / Sem orçamento',
    descricao: 'Objeção de preço ou falta de budget',
    resposta: `Entendo perfeitamente! Investimento é uma decisão importante.

Deixa eu te fazer uma pergunta: quanto você estima que está deixando de faturar por não ter uma presença digital forte?

Nossos clientes em média recuperam o investimento em [X] meses. Posso te mostrar os números?`,
    categoria: 'Preço',
    acaoSeguinte: 'Apresentar ROI e cases de sucesso com números'
  },
  {
    id: '5',
    titulo: 'Preciso pensar / Depois conversamos',
    descricao: 'Lead adia a decisão indefinidamente',
    resposta: `Claro! É uma decisão importante mesmo.

Para te ajudar a pensar, posso te enviar:
1. Um case de cliente do seu segmento
2. Uma análise rápida do seu perfil atual

Assim você tem mais informações para decidir. Posso enviar?`,
    categoria: 'Procrastinação',
    acaoSeguinte: 'Enviar material e agendar follow-up em 5 dias'
  },
];

export const mockMetrics: DashboardMetrics = {
  receitaTotal: 127500,
  receitaRecorrente: 98000,
  churn: 4.2,
  ltv: 18500,
  cac: 850,
  leadsNovos: 47,
  reunioesAgendadas: 12,
  taxaConversao: 23.5,
};

export const pipelineStages = [
  { id: 'novo', label: 'Novo', color: 'bg-blue-500' },
  { id: 'contatado', label: 'Contatado', color: 'bg-yellow-500' },
  { id: 'respondeu', label: 'Respondeu', color: 'bg-orange-500' },
  { id: 'reuniao_marcada', label: 'Reunião Marcada', color: 'bg-purple-500' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', color: 'bg-indigo-500' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-pink-500' },
  { id: 'fechado', label: 'Fechado ✓', color: 'bg-green-500' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-500' },
  { id: 'nutricao', label: 'Nutrição', color: 'bg-teal-500' },
] as const;