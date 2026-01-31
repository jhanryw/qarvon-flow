// CRM Types
export type LeadStatus = 
  | 'novo' 
  | 'contatado' 
  | 'respondeu' 
  | 'reuniao_marcada' 
  | 'proposta_enviada' 
  | 'negociacao' 
  | 'fechado' 
  | 'perdido'
  | 'nutricao';

export type LeadSource = 'inbound' | 'outbound' | 'indicacao' | 'pap' | 'trafego_pago';

export type ContactType = 'loja' | 'decisor';

export interface Lead {
  id: string;
  nome: string;
  empresa: string;
  cargo: string;
  telefone: string;
  email: string;
  segmento: string;
  localizacao: string;
  status: LeadStatus;
  origem: LeadSource;
  tipoContato: ContactType;
  responsavel: string;
  dataCriacao: Date;
  ultimoContato: Date;
  proximoContato?: Date;
  observacoes: string;
  historico: ContactHistory[];
  ltv?: number;
  reuniaoNotas?: string;
}

export interface ContactHistory {
  id: string;
  data: Date;
  tipo: 'whatsapp' | 'ligacao' | 'email' | 'reuniao' | 'nota';
  mensagem: string;
  resposta?: string;
}

// Cadence Types
export interface CadenceStep {
  id: string;
  dia: number;
  canal: 'whatsapp' | 'ligacao' | 'email';
  mensagem: string;
  tipo: 'loja' | 'decisor';
}

export interface Cadence {
  id: string;
  nome: string;
  tipo: ContactType;
  steps: CadenceStep[];
}

// Objection Types
export interface Objection {
  id: string;
  titulo: string;
  descricao: string;
  resposta: string;
  categoria: string;
  acaoSeguinte?: string;
}

// Financial Types
export interface Transaction {
  id: string;
  data: Date;
  tipo: 'entrada' | 'saida';
  categoria: string;
  subcategoria: string;
  valor: number;
  cliente?: string;
  canal?: LeadSource;
  observacoes: string;
}

// User & Permissions
export type UserRole = 'admin' | 'financeiro' | 'rh' | 'social_media' | 'gestor_trafego' | 'vendedor';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  receitaTotal: number;
  receitaRecorrente: number;
  churn: number;
  ltv: number;
  cac: number;
  leadsNovos: number;
  reunioesAgendadas: number;
  taxaConversao: number;
}