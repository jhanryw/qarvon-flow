import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        caption?: string;
        mimetype?: string;
      };
      audioMessage?: {
        mimetype?: string;
      };
      documentMessage?: {
        fileName?: string;
        mimetype?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
  sender?: string;
  apikey?: string;
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
    
    const payload: EvolutionMessage = await req.json();
    
    console.log('Evolution webhook received:', JSON.stringify(payload));

    // Only process incoming messages
    if (payload.event !== 'messages.upsert') {
      console.log('Ignoring non-message event:', payload.event);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = payload.data;
    
    // Skip messages sent by the user (fromMe)
    if (data.key.fromMe) {
      console.log('Ignoring outgoing message');
      return new Response(
        JSON.stringify({ success: true, message: 'Outgoing message ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract phone number from remoteJid (format: 5511999999999@s.whatsapp.net)
    const remoteJid = data.key.remoteJid;
    const phoneNumber = remoteJid.split('@')[0];
    
    // Skip group messages
    if (remoteJid.includes('@g.us')) {
      console.log('Ignoring group message');
      return new Response(
        JSON.stringify({ success: true, message: 'Group message ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract message content
    let messageContent = '';
    let mediaType = null;
    let mediaUrl = null;

    if (data.message?.conversation) {
      messageContent = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      messageContent = data.message.extendedTextMessage.text;
    } else if (data.message?.imageMessage) {
      messageContent = data.message.imageMessage.caption || '[Imagem]';
      mediaType = 'image';
    } else if (data.message?.audioMessage) {
      messageContent = '[Áudio]';
      mediaType = 'audio';
    } else if (data.message?.documentMessage) {
      messageContent = `[Documento: ${data.message.documentMessage.fileName || 'arquivo'}]`;
      mediaType = 'document';
    } else {
      messageContent = '[Mensagem não suportada]';
    }

    const contactName = data.pushName || phoneNumber;
    const instanceName = payload.instance;

    console.log(`Processing message from ${phoneNumber} (${contactName}): ${messageContent.substring(0, 50)}...`);

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('inbox_conversations')
      .select('id, unread_count')
      .eq('external_contact_id', phoneNumber)
      .eq('channel_type', 'whatsapp')
      .single();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
      
      // Update conversation with new message info
      const { error: updateError } = await supabase
        .from('inbox_conversations')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString(),
          unread_count: (existingConversation.unread_count || 0) + 1,
          contact_name: contactName, // Update name if we got it
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      }
    } else {
      // Create new conversation in 'pendente' status
      const { data: newConversation, error: convError } = await supabase
        .from('inbox_conversations')
        .insert({
          channel_type: 'whatsapp',
          external_contact_id: phoneNumber,
          contact_name: contactName,
          contact_phone: phoneNumber,
          status: 'pendente',
          origem: 'inbound', // Default to inbound for WhatsApp messages
          last_message: messageContent,
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
      console.log('Created new conversation:', conversationId);
    }

    // Add message to conversation
    const { error: msgError } = await supabase
      .from('inbox_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'contact',
        content: messageContent,
        media_type: mediaType,
        media_url: mediaUrl,
        is_read: false
      });

    if (msgError) {
      console.error('Error creating message:', msgError);
      return new Response(
        JSON.stringify({ error: 'Failed to create message', details: msgError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Message saved successfully to conversation:', conversationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversation_id: conversationId,
        message: 'Message received and processed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Evolution webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
