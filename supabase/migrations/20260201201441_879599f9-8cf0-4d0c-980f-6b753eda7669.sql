-- Enum para roles do sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'financeiro', 'rh', 'social_media', 'gestor_trafego', 'vendedor', 'sdr_outbound');

-- Enum para origem do lead
CREATE TYPE public.lead_source AS ENUM ('inbound', 'outbound', 'indicacao', 'pap', 'trafego_pago');

-- Enum para status do lead
CREATE TYPE public.lead_status AS ENUM ('novo', 'contatado', 'respondeu', 'reuniao_marcada', 'proposta_enviada', 'negociacao', 'fechado', 'perdido', 'nutricao');

-- Enum para canal de comunicação
CREATE TYPE public.channel_type AS ENUM ('whatsapp', 'instagram', 'email', 'ligacao');

-- Enum para status de conversa no inbox
CREATE TYPE public.conversation_status AS ENUM ('pendente', 'ativo', 'arquivado');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Configuração de canais de vendedores (WhatsApp/Instagram instances)
CREATE TABLE public.seller_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_type channel_type NOT NULL,
  instance_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel_type, instance_name)
);

-- Tabela de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa TEXT,
  cargo TEXT,
  telefone TEXT,
  email TEXT,
  segmento TEXT,
  localizacao TEXT,
  status lead_status NOT NULL DEFAULT 'novo',
  origem lead_source NOT NULL DEFAULT 'outbound',
  responsavel_id UUID REFERENCES auth.users(id),
  ltv NUMERIC(12,2),
  reuniao_notas TEXT,
  observacoes TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_contato TIMESTAMPTZ,
  proximo_contato TIMESTAMPTZ,
  data_abertura TIMESTAMPTZ,
  mensagem_enviada BOOLEAN DEFAULT false
);

-- Histórico de contatos com leads
CREATE TABLE public.lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  tipo channel_type NOT NULL,
  mensagem TEXT NOT NULL,
  resposta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inbox unificado - conversas
CREATE TABLE public.inbox_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  channel_type channel_type NOT NULL,
  external_contact_id TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_avatar TEXT,
  status conversation_status NOT NULL DEFAULT 'pendente',
  assigned_to UUID REFERENCES auth.users(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  origem lead_source,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mensagens do inbox
CREATE TABLE public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.inbox_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('contact', 'seller', 'system')),
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transações financeiras
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  valor NUMERIC(12,2) NOT NULL,
  cliente TEXT,
  canal lead_source,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inbox_conversations_updated_at BEFORE UPDATE ON public.inbox_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_channels_updated_at BEFORE UPDATE ON public.seller_channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies para user_roles (apenas admins gerenciam)
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies para seller_channels
CREATE POLICY "Users can view own channels" ON public.seller_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own channels" ON public.seller_channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all channels" ON public.seller_channels FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies para leads
CREATE POLICY "Vendedores veem seus leads" ON public.leads FOR SELECT USING (auth.uid() = responsavel_id OR public.is_admin(auth.uid()));
CREATE POLICY "Vendedores criam leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = responsavel_id OR public.is_admin(auth.uid()));
CREATE POLICY "Vendedores atualizam seus leads" ON public.leads FOR UPDATE USING (auth.uid() = responsavel_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins podem deletar leads" ON public.leads FOR DELETE USING (public.is_admin(auth.uid()));

-- RLS Policies para lead_history
CREATE POLICY "Users can view lead history" ON public.lead_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND (responsavel_id = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "Users can insert lead history" ON public.lead_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies para inbox_conversations
CREATE POLICY "Vendedores veem suas conversas ou pendentes" ON public.inbox_conversations FOR SELECT USING (
  assigned_to = auth.uid() OR status = 'pendente' OR public.is_admin(auth.uid())
);
CREATE POLICY "Vendedores podem atualizar conversas atribuídas" ON public.inbox_conversations FOR UPDATE USING (
  assigned_to = auth.uid() OR public.is_admin(auth.uid())
);
CREATE POLICY "Admins podem gerenciar todas conversas" ON public.inbox_conversations FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies para inbox_messages
CREATE POLICY "Users can view messages of their conversations" ON public.inbox_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.inbox_conversations WHERE id = conversation_id AND (assigned_to = auth.uid() OR public.is_admin(auth.uid())))
);
CREATE POLICY "Users can insert messages" ON public.inbox_messages FOR INSERT WITH CHECK (auth.uid() = sender_id OR sender_type = 'contact');

-- RLS Policies para transactions
CREATE POLICY "Admins e financeiro veem transações" ON public.transactions FOR SELECT USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro')
);
CREATE POLICY "Admins e financeiro criam transações" ON public.transactions FOR INSERT WITH CHECK (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro')
);
CREATE POLICY "Admins e financeiro atualizam transações" ON public.transactions FOR UPDATE USING (
  public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'financeiro')
);

-- Habilitar realtime para inbox
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_messages;