import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface WebhookPayload {
  channel_type: 'whatsapp' | 'instagram';
  external_contact_id: string;
  contact_name?: string;
  contact_phone?: string;
  contact_avatar?: string;
  message: string;
  origem?: 'inbound' | 'outbound' | 'indicacao' | 'pap' | 'trafego_pago';
  // For lead creation from paid traffic
  create_lead?: boolean;
  lead_data?: {
    nome: string;
    empresa?: string;
    email?: string;
    telefone?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload: WebhookPayload = await req.json();
    
    console.log('Received webhook payload:', JSON.stringify(payload));

    // Validate required fields
    if (!payload.channel_type || !payload.external_contact_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: channel_type and external_contact_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If creating a lead from paid traffic
    if (payload.create_lead && payload.lead_data) {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          nome: payload.lead_data.nome,
          empresa: payload.lead_data.empresa,
          email: payload.lead_data.email,
          telefone: payload.lead_data.telefone || payload.contact_phone,
          origem: payload.origem || 'trafego_pago',
          status: 'novo',
          utm_source: payload.lead_data.utm_source,
          utm_medium: payload.lead_data.utm_medium,
          utm_campaign: payload.lead_data.utm_campaign,
          utm_content: payload.lead_data.utm_content,
        })
        .select()
        .single();

      if (leadError) {
        console.error('Error creating lead:', leadError);
        return new Response(
          JSON.stringify({ error: 'Failed to create lead', details: leadError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, lead_id: lead.id, message: 'Lead created successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('inbox_conversations')
      .select('id')
      .eq('external_contact_id', payload.external_contact_id)
      .eq('channel_type', payload.channel_type)
      .single();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
      
      // Update conversation with new message info
      await supabase
        .from('inbox_conversations')
        .update({
          last_message: payload.message,
          last_message_at: new Date().toISOString(),
          unread_count: supabase.rpc('increment', { x: 1 }) // Will need to create this function
        })
        .eq('id', conversationId);
    } else {
      // Create new conversation in 'pendente' status
      const { data: newConversation, error: convError } = await supabase
        .from('inbox_conversations')
        .insert({
          channel_type: payload.channel_type,
          external_contact_id: payload.external_contact_id,
          contact_name: payload.contact_name,
          contact_phone: payload.contact_phone,
          contact_avatar: payload.contact_avatar,
          status: 'pendente',
          origem: payload.origem,
          last_message: payload.message,
          last_message_at: new Date().toISOString(),
          unread_count: 1
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation', details: convError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      conversationId = newConversation.id;
    }

    // Add message to conversation
    const { error: msgError } = await supabase
      .from('inbox_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'contact',
        content: payload.message
      });

    if (msgError) {
      console.error('Error creating message:', msgError);
      return new Response(
        JSON.stringify({ error: 'Failed to create message', details: msgError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation_id: conversationId,
        message: 'Message received and processed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
