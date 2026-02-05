import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Instagram, 
  Phone, 
  Search, 
  Check, 
  X, 
  UserPlus,
  Send,
  Clock,
  Archive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Conversation = Tables<'inbox_conversations'>;
type Message = Tables<'inbox_messages'>;

const channelIcons = {
  whatsapp: MessageSquare,
  instagram: Instagram,
  email: Phone,
  ligacao: Phone
};

const channelColors = {
  whatsapp: 'bg-green-500/20 text-green-400',
  instagram: 'bg-pink-500/20 text-pink-400',
  email: 'bg-blue-500/20 text-blue-400',
  ligacao: 'bg-yellow-500/20 text-yellow-400'
};

const origemLabels = {
  inbound: 'Inbound',
  outbound: 'Outbound',
  indicacao: 'Indicação',
  pap: 'PAP',
  trafego_pago: 'Tráfego Pago'
};

export function UnifiedInbox() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pendente' | 'ativo' | 'arquivado'>('pendente');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('inbox-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'inbox_conversations' 
      }, () => fetchConversations())
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'inbox_messages' 
      }, (payload) => {
        if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const fetchConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inbox_conversations')
      .select('*')
      .eq('status', activeTab)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleAcceptConversation = async (conversation: Conversation, createLead: boolean = true) => {
    if (!user) return;

    // Update conversation status
    const { error } = await supabase
      .from('inbox_conversations')
      .update({ 
        status: 'ativo', 
        assigned_to: user.id 
      })
      .eq('id', conversation.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível aceitar a conversa', variant: 'destructive' });
      return;
    }

    // Create lead automatically when accepting
    if (createLead && !conversation.lead_id) {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          nome: conversation.contact_name || 'Novo Lead',
          telefone: conversation.contact_phone,
          origem: conversation.origem || 'inbound',
          responsavel_id: user.id,
          status: 'novo',
          criado_via: conversation.channel_type // 'whatsapp' or 'instagram'
        })
        .select()
        .single();

      if (!leadError && lead) {
        // Link conversation to lead
        await supabase
          .from('inbox_conversations')
          .update({ lead_id: lead.id })
          .eq('id', conversation.id);

        toast({ 
          title: 'Conversa aceita', 
          description: `Lead "${lead.nome}" criado automaticamente no CRM!` 
        });
      } else {
        toast({ title: 'Conversa aceita', description: 'Agora você é responsável por essa conversa' });
      }
    } else {
      toast({ title: 'Conversa aceita', description: 'Agora você é responsável por essa conversa' });
    }
    
    fetchConversations();
  };

  const handleRejectConversation = async (conversation: Conversation) => {
    const { error } = await supabase
      .from('inbox_conversations')
      .update({ status: 'arquivado' })
      .eq('id', conversation.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível arquivar a conversa', variant: 'destructive' });
    } else {
      toast({ title: 'Conversa arquivada' });
      fetchConversations();
    }
  };

  const handleUpdateOrigem = async (conversation: Conversation, origem: string) => {
    const { error } = await supabase
      .from('inbox_conversations')
      .update({ origem: origem as any })
      .eq('id', conversation.id);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar a origem', variant: 'destructive' });
    } else {
      toast({ title: 'Origem atualizada' });
      fetchConversations();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const { error } = await supabase
      .from('inbox_messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_type: 'seller',
        sender_id: user.id,
        content: newMessage
      });

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível enviar a mensagem', variant: 'destructive' });
    } else {
      setNewMessage('');
      // Update last message
      await supabase
        .from('inbox_conversations')
        .update({ 
          last_message: newMessage, 
          last_message_at: new Date().toISOString() 
        })
        .eq('id', selectedConversation.id);
    }
  };

  const handlePromoteToLead = async (conversation: Conversation) => {
    if (!user) return;

    // Create a new lead from the conversation - marked as from channel
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        nome: conversation.contact_name || 'Novo Lead',
        telefone: conversation.contact_phone,
        origem: conversation.origem || 'inbound',
        responsavel_id: user.id,
        status: 'novo',
        criado_via: conversation.channel_type // 'whatsapp' or 'instagram'
      })
      .select()
      .single();

    if (leadError) {
      toast({ title: 'Erro', description: 'Não foi possível criar o lead', variant: 'destructive' });
      return;
    }

    // Link conversation to lead
    await supabase
      .from('inbox_conversations')
      .update({ lead_id: lead.id })
      .eq('id', conversation.id);

    toast({ title: 'Lead criado!', description: 'A conversa foi vinculada ao novo lead no CRM' });
  };

  const filteredConversations = conversations.filter(c => 
    c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_phone?.includes(searchTerm)
  );

  return (
    <div className="h-full flex bg-background p-6 gap-6">
      {/* Conversations List */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <MessageSquare className="w-5 h-5 text-primary" />
            Inbox Unificado
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full justify-start px-4 bg-transparent">
              <TabsTrigger value="pendente" className="gap-1">
                <Clock className="w-4 h-4" />
                Pendentes
              </TabsTrigger>
              <TabsTrigger value="ativo" className="gap-1">
                <MessageSquare className="w-4 h-4" />
                Ativos
              </TabsTrigger>
              <TabsTrigger value="arquivado" className="gap-1">
                <Archive className="w-4 h-4" />
                Arquivo
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[calc(100vh-320px)]">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhuma conversa encontrada
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const Icon = channelIcons[conversation.channel_type];
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors",
                        selectedConversation?.id === conversation.id && "bg-accent"
                      )}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", channelColors[conversation.channel_type])}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground truncate">
                              {conversation.contact_name || conversation.contact_phone || 'Desconhecido'}
                            </span>
                            {conversation.unread_count && conversation.unread_count > 0 && (
                              <Badge variant="default" className="bg-primary text-primary-foreground">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message || 'Sem mensagens'}
                          </p>
                          {conversation.origem && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {origemLabels[conversation.origem]}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {activeTab === 'pendente' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptConversation(conversation);
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectConversation(conversation);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", channelColors[selectedConversation.channel_type])}>
                    {(() => {
                      const Icon = channelIcons[selectedConversation.channel_type];
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <CardTitle className="text-foreground">
                      {selectedConversation.contact_name || selectedConversation.contact_phone}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.contact_phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedConversation.origem || ''}
                    onValueChange={(v) => handleUpdateOrigem(selectedConversation, v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="pap">PAP</SelectItem>
                      <SelectItem value="trafego_pago">Tráfego Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  {!selectedConversation.lead_id && (
                    <Button
                      size="sm"
                      onClick={() => handlePromoteToLead(selectedConversation)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Criar Lead
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-4 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender_type === 'seller' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] p-3 rounded-lg",
                          message.sender_type === 'seller'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para visualizar</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
