import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractEvolutionError(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  const directMessage = d.message;
  if (typeof directMessage === 'string' && directMessage.trim()) return directMessage;
  if (Array.isArray(directMessage)) {
    const parts = directMessage.filter((x) => typeof x === 'string') as string[];
    if (parts.length) return parts.join(' | ');
  }

  const directError = d.error;
  if (typeof directError === 'string' && directError.trim()) return directError;

  const response = d.response;
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>;
    const rMessage = r.message;
    if (typeof rMessage === 'string' && rMessage.trim()) return rMessage;
    if (Array.isArray(rMessage)) {
      const parts = rMessage.filter((x) => typeof x === 'string') as string[];
      if (parts.length) return parts.join(' | ');
    }
    const rError = r.error;
    if (typeof rError === 'string' && rError.trim()) return rError;
  }

  return null;
}

    interface EvolutionRequestBody {
      action: 'create_instance' | 'get_qr' | 'get_status' | 'logout' | 'delete_instance' | 'send_message' | 'fetch_instances' | 'set_webhook' | 'sync_messages';
  instance_name: string;
  channel_id?: string;
  message?: string;
  phone?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

      console.log(`Using Evolution API URL: ${EVOLUTION_API_URL}`);
      console.log(`API Key present: ${EVOLUTION_API_KEY ? 'Yes (length: ' + EVOLUTION_API_KEY.length + ')' : 'No'}`);
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const body: EvolutionRequestBody = await req.json();
    const { action, instance_name, channel_id, message, phone } = body;

    // Normalize API URL (remove trailing slash)
    const apiUrl = EVOLUTION_API_URL.replace(/\/$/, '');

    console.log(`Evolution API action: ${action} for instance: ${instance_name}`);

      // Try fetching existing instances first to validate API key
      if (action === 'fetch_instances') {
        const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: { 'apikey': EVOLUTION_API_KEY },
        });
    
        const data = await response.json();
        console.log('Fetch instances response:', JSON.stringify(data));
    
        return new Response(
          JSON.stringify({ success: response.ok, instances: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    
    // Get webhook URL for this project
    const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/evolution-webhook`;

    switch (action) {
      case 'create_instance': {
          const createUrl = `${apiUrl}/instance/create`;
          console.log(`Creating instance at: ${createUrl}`);
          
          // First, check if instance already exists and its status
          let existingConnected = false;
          let existingQr: string | null = null;
          try {
            console.log(`Checking if instance ${instance_name} already exists...`);
            const statusResp = await fetch(`${apiUrl}/instance/connectionState/${instance_name}`, {
              method: 'GET',
              headers: { 'apikey': EVOLUTION_API_KEY },
            });
            if (statusResp.ok) {
              const statusData = await statusResp.json();
              console.log('Existing instance status:', JSON.stringify(statusData));
              const state = statusData.state || statusData.instance?.state;
              
              if (state === 'open') {
                // Already connected! Configure webhook and update channel
                existingConnected = true;
                console.log('Instance already connected! Setting webhook...');
                
                // Always set/update webhook on existing instances
                try {
                  const webhookResp = await fetch(`${apiUrl}/webhook/set/${instance_name}`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'apikey': EVOLUTION_API_KEY,
                    },
                    body: JSON.stringify({
                      webhook: {
                        enabled: true,
                        url: WEBHOOK_URL,
                        byEvents: false,
                        base64: false,
                        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
                      }
                    }),
                  });
                  const webhookData = await webhookResp.json();
                  console.log('Webhook set response:', JSON.stringify(webhookData));
                } catch (whErr) {
                  console.error('Failed to set webhook (non-fatal):', whErr);
                }
                
                if (channel_id) {
                  await supabase
                    .from('seller_channels')
                    .update({
                      config: {
                        status: 'connected',
                        evolution_instance: instance_name,
                        last_connected: new Date().toISOString(),
                      },
                      is_active: true
                    })
                    .eq('id', channel_id);
                }
                
                return new Response(
                  JSON.stringify({ 
                    success: true, 
                    already_connected: true,
                    instance: instance_name,
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
              
              // Instance exists but not connected - try to get QR
              if (state === 'connecting' || state === 'close') {
                console.log('Instance exists but not connected, fetching QR...');
                const connectResp = await fetch(`${apiUrl}/instance/connect/${instance_name}`, {
                  method: 'GET',
                  headers: { 'apikey': EVOLUTION_API_KEY },
                });
                const connectData = await connectResp.json();
                console.log('Connect response for existing:', JSON.stringify(connectData));
                existingQr = connectData.base64 || connectData.qrcode?.base64 || null;
                
                if (existingQr) {
                  if (!existingQr.startsWith('data:')) {
                    existingQr = `data:image/png;base64,${existingQr}`;
                  }
                  
                  if (channel_id) {
                    await supabase
                      .from('seller_channels')
                      .update({
                        config: {
                          status: 'qr_ready',
                          qr_code: existingQr,
                          evolution_instance: instance_name,
                        }
                      })
                      .eq('id', channel_id);
                  }
                  
                  return new Response(
                    JSON.stringify({ 
                      success: true, 
                      qr_code: existingQr,
                      instance: instance_name,
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                  );
                }
              }
            }
          } catch (e) {
            console.log('Instance does not exist or check failed, will create new:', e);
          }
          
          // Instance doesn't exist or couldn't get QR - create fresh
          let response = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            instanceName: instance_name,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
            // Configure webhook to receive messages
            webhook: {
              url: WEBHOOK_URL,
              byEvents: false,
              base64: false,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
            }
          }),
        });

          let data = await response.json();
        console.log('Create instance response:', JSON.stringify(data));

          // If unauthorized, try with Authorization Bearer header (alternative format)
          if (response.status === 401) {
            console.log('Trying with Authorization Bearer header...');
            response = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
              },
              body: JSON.stringify({
                instanceName: instance_name,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
                webhook: {
                  url: WEBHOOK_URL,
                  byEvents: false,
                  base64: false,
                  events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
                }
              }),
            });
            data = await response.json();
            console.log('Create instance response (Bearer):', JSON.stringify(data));
          }
    
        if (!response.ok) {
          const evolutionError = extractEvolutionError(data) || 'Failed to create instance';
          const evolutionErrorLower = evolutionError.toLowerCase();

          // Instance already exists — delete it and recreate
          if (evolutionErrorLower.includes('already in use') || evolutionErrorLower.includes('já está em uso') || evolutionErrorLower.includes('already') || evolutionErrorLower.includes('exists')) {
            console.log('Instance already exists, deleting and recreating...');
            
            // Delete existing instance
            await fetch(`${apiUrl}/instance/delete/${instance_name}`, {
              method: 'DELETE',
              headers: { 'apikey': EVOLUTION_API_KEY },
            });
            
            // Wait a moment for deletion to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Recreate instance
            const recreateResponse = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                instanceName: instance_name,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
                webhook: {
                  url: WEBHOOK_URL,
                  byEvents: false,
                  base64: false,
                  events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
                }
              }),
            });
            
            const recreateData = await recreateResponse.json();
            console.log('Recreate instance response:', JSON.stringify(recreateData));
            
            // Get QR code from recreated instance
            let qrCodeValue = recreateData.qrcode?.base64 || null;
            
            // Poll connect endpoint if no QR in response
            if (!qrCodeValue) {
              for (let attempt = 0; attempt < 8; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log(`Connect attempt ${attempt + 1}/8 (recreated)...`);
                const connectResp = await fetch(`${apiUrl}/instance/connect/${instance_name}`, {
                  method: 'GET',
                  headers: { 'apikey': EVOLUTION_API_KEY },
                });
                const connectData = await connectResp.json();
                console.log('Connect response:', JSON.stringify(connectData));
                qrCodeValue = connectData.base64 || connectData.qrcode?.base64 || null;
                if (qrCodeValue) break;
              }
            }
            
            if (qrCodeValue && !qrCodeValue.startsWith('data:')) {
              qrCodeValue = `data:image/png;base64,${qrCodeValue}`;
            }

            if (channel_id) {
              await supabase
                .from('seller_channels')
                .update({
                  config: {
                    status: qrCodeValue ? 'qr_ready' : 'connecting',
                    qr_code: qrCodeValue,
                    evolution_instance: instance_name,
                  }
                })
                .eq('id', channel_id);
            }

            return new Response(
              JSON.stringify({ 
                success: true, 
                qr_code: qrCodeValue,
                instance: instance_name,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Surface Evolution's error message (instead of returning 500)
          return new Response(
            JSON.stringify({
              success: false,
              error: evolutionError,
              status: response.status,
            }),
            { status: response.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract QR code — may come directly or need a separate connect call
        let qrCodeValue = data.qrcode?.base64 || null;

        // If no QR code in create response, poll connect endpoint with retries
        if (!qrCodeValue) {
          console.log('No QR in create response, polling connect endpoint...');
          for (let attempt = 0; attempt < 5; attempt++) {
            // Wait before each attempt (1s, 2s, 3s, 4s, 5s)
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
            console.log(`Connect attempt ${attempt + 1}/5...`);
            const connectResponse = await fetch(`${apiUrl}/instance/connect/${instance_name}`, {
              method: 'GET',
              headers: { 'apikey': EVOLUTION_API_KEY },
            });
            const connectData = await connectResponse.json();
            console.log('Connect response:', JSON.stringify(connectData));
            qrCodeValue = connectData.base64 || connectData.qrcode?.base64 || null;
            if (qrCodeValue) break;
          }
        }

        // Normalize prefix
        if (qrCodeValue && !qrCodeValue.startsWith('data:')) {
          qrCodeValue = `data:image/png;base64,${qrCodeValue}`;
        }

        // Update channel config
        if (channel_id) {
          await supabase
            .from('seller_channels')
            .update({
              config: {
                status: qrCodeValue ? 'qr_ready' : 'connecting',
                qr_code: qrCodeValue,
                evolution_instance: instance_name,
              }
            })
            .eq('id', channel_id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            qr_code: qrCodeValue,
            instance: data.instance || instance_name 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_qr': {
        // Get QR code for existing instance
        const response = await fetch(`${apiUrl}/instance/connect/${instance_name}`, {
          method: 'GET',
          headers: { 'apikey': EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log('Get QR response:', JSON.stringify(data));

        if (!response.ok) {
          throw new Error(data.message || 'Failed to get QR code');
        }

        const qrBase64 = data.base64 || data.qrcode?.base64;
        
        // Normalize: add prefix only if missing
        let qrCodeValue = qrBase64 || null;
        if (qrCodeValue && !qrCodeValue.startsWith('data:')) {
          qrCodeValue = `data:image/png;base64,${qrCodeValue}`;
        }

        // Update channel config
        if (channel_id && qrCodeValue) {
          await supabase
            .from('seller_channels')
            .update({
              config: {
                status: 'qr_ready',
                qr_code: qrCodeValue,
                evolution_instance: instance_name,
              }
            })
            .eq('id', channel_id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            qr_code: qrCodeValue,
            code: data.code // QR code string for fallback
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_status': {
        // Check connection status
        const response = await fetch(`${apiUrl}/instance/connectionState/${instance_name}`, {
          method: 'GET',
          headers: { 'apikey': EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log('Get status response:', JSON.stringify(data));

        const isConnected = data.state === 'open' || data.instance?.state === 'open';

        // Update channel config based on status
        if (channel_id) {
          const newStatus = isConnected ? 'connected' : 'disconnected';
          await supabase
            .from('seller_channels')
            .update({
              config: {
                status: newStatus,
                evolution_instance: instance_name,
                last_connected: isConnected ? new Date().toISOString() : undefined,
              },
              is_active: isConnected
            })
            .eq('id', channel_id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            connected: isConnected,
            state: data.state || data.instance?.state
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'logout': {
        // Logout/disconnect instance
        const response = await fetch(`${apiUrl}/instance/logout/${instance_name}`, {
          method: 'DELETE',
          headers: { 'apikey': EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log('Logout response:', JSON.stringify(data));

        // Update channel config
        if (channel_id) {
          await supabase
            .from('seller_channels')
            .update({
              config: {
                status: 'disconnected',
                evolution_instance: instance_name,
              },
              is_active: false
            })
            .eq('id', channel_id);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Instance logged out' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_instance': {
        // Delete instance completely
        const response = await fetch(`${apiUrl}/instance/delete/${instance_name}`, {
          method: 'DELETE',
          headers: { 'apikey': EVOLUTION_API_KEY },
        });

        const data = await response.json();
        console.log('Delete response:', JSON.stringify(data));

        return new Response(
          JSON.stringify({ success: true, message: 'Instance deleted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'send_message': {
        if (!phone || !message) {
          return new Response(
            JSON.stringify({ error: 'Phone and message are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Send text message
        const response = await fetch(`${apiUrl}/message/sendText/${instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: phone,
            text: message,
          }),
        });

        const data = await response.json();
        console.log('Send message response:', JSON.stringify(data));

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send message');
        }

        return new Response(
          JSON.stringify({ success: true, message_id: data.key?.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'set_webhook': {
        // Configure webhook for existing instance using Evolution API v2 format
        console.log(`Setting webhook for instance: ${instance_name}`);
        console.log(`Webhook URL: ${WEBHOOK_URL}`);
        
        // Evolution API v2 uses /instance/update to set webhook for existing instances
        const response = await fetch(`${apiUrl}/instance/update/${instance_name}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            webhook: {
              url: WEBHOOK_URL,
              byEvents: false,
              base64: false,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
            }
          }),
        });

        const data = await response.json();
        console.log('Set webhook (update) response:', JSON.stringify(data));

        // If update doesn't work, try direct webhook endpoint with instance object
        if (!response.ok) {
          console.log('Update failed, trying alternative endpoint...');
          
          const altResponse = await fetch(`${apiUrl}/instance/${instance_name}/webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              url: WEBHOOK_URL,
              enabled: true,
              events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
            }),
          });
          
          const altData = await altResponse.json();
          console.log('Set webhook (alt) response:', JSON.stringify(altData));
          
          if (!altResponse.ok) {
            const errorMsg = extractEvolutionError(altData) || extractEvolutionError(data) || 'Failed to set webhook';
            return new Response(
              JSON.stringify({ success: false, error: errorMsg, hint: 'Webhook may need to be configured when creating the instance' }),
              { status: altResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ success: true, message: 'Webhook configured successfully (alternative method)' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Webhook configured successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync_messages': {
        // Fetch all chats from Evolution API and import into inbox
        console.log(`Syncing messages for instance: ${instance_name}`);
        
        // 1. Get all chats
        const chatsResp = await fetch(`${apiUrl}/chat/findChats/${instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({}),
        });
        
        if (!chatsResp.ok) {
          const errData = await chatsResp.json();
          console.error('findChats error:', JSON.stringify(errData));
          return new Response(
            JSON.stringify({ error: 'Failed to fetch chats', details: extractEvolutionError(errData) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const chats = await chatsResp.json();
        console.log(`Found ${Array.isArray(chats) ? chats.length : 0} chats`);
        
        if (!Array.isArray(chats) || chats.length === 0) {
          return new Response(
            JSON.stringify({ success: true, synced: 0, message: 'No chats found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        let syncedCount = 0;
        let errorsCount = 0;
        
        for (const chat of chats) {
          try {
            // Skip groups
            const remoteJid = chat.id || chat.remoteJid || '';
            if (remoteJid.includes('@g.us') || !remoteJid.includes('@')) continue;
            
            const phoneNumber = remoteJid.split('@')[0];
            const contactName = chat.name || chat.pushName || chat.contact?.name || phoneNumber;
            
            // Check if conversation already exists
            const { data: existing } = await supabase
              .from('inbox_conversations')
              .select('id')
              .eq('external_contact_id', phoneNumber)
              .eq('channel_type', 'whatsapp')
              .single();
            
            let conversationId: string;
            
            if (existing) {
              conversationId = existing.id;
            } else {
              // Create conversation
              const { data: newConv, error: convErr } = await supabase
                .from('inbox_conversations')
                .insert({
                  channel_type: 'whatsapp',
                  external_contact_id: phoneNumber,
                  contact_name: contactName,
                  contact_phone: phoneNumber,
                  status: 'pendente',
                  origem: 'inbound',
                  unread_count: 0,
                })
                .select()
                .single();
              
              if (convErr) {
                console.error(`Error creating conversation for ${phoneNumber}:`, convErr);
                errorsCount++;
                continue;
              }
              conversationId = newConv.id;
            }
            
            // 2. Fetch messages for this chat
            const msgsResp = await fetch(`${apiUrl}/chat/findMessages/${instance_name}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                where: {
                  key: {
                    remoteJid: remoteJid,
                  }
                },
                limit: 50,
              }),
            });
            
            if (!msgsResp.ok) {
              console.error(`Failed to fetch messages for ${remoteJid}`);
              errorsCount++;
              continue;
            }
            
            const msgs = await msgsResp.json();
            const messageArray = Array.isArray(msgs) ? msgs : (msgs.messages || []);
            
            if (messageArray.length === 0) continue;
            
            // Get existing message count to avoid duplicates
            const { count: existingMsgCount } = await supabase
              .from('inbox_messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conversationId);
            
            // Only import if conversation has no messages yet
            if ((existingMsgCount || 0) > 0) {
              console.log(`Conversation ${phoneNumber} already has messages, skipping`);
              syncedCount++;
              continue;
            }
            
            // Insert messages
            const messagesToInsert = messageArray.map((msg: any) => {
              const fromMe = msg.key?.fromMe || false;
              let content = '';
              
              if (msg.message?.conversation) {
                content = msg.message.conversation;
              } else if (msg.message?.extendedTextMessage?.text) {
                content = msg.message.extendedTextMessage.text;
              } else if (msg.message?.imageMessage) {
                content = msg.message.imageMessage.caption || '[Imagem]';
              } else if (msg.message?.audioMessage) {
                content = '[Áudio]';
              } else if (msg.message?.documentMessage) {
                content = `[Documento: ${msg.message.documentMessage.fileName || 'arquivo'}]`;
              } else {
                content = '[Mensagem]';
              }
              
              if (!content) content = '[Mensagem]';
              
              const timestamp = msg.messageTimestamp
                ? new Date(typeof msg.messageTimestamp === 'number' 
                    ? msg.messageTimestamp * 1000 
                    : msg.messageTimestamp
                  ).toISOString()
                : new Date().toISOString();
              
              return {
                conversation_id: conversationId,
                sender_type: fromMe ? 'seller' : 'contact',
                content,
                is_read: true,
                created_at: timestamp,
              };
            }).filter((m: any) => m.content && m.content !== '[Mensagem]');
            
            if (messagesToInsert.length > 0) {
              const { error: insertErr } = await supabase
                .from('inbox_messages')
                .insert(messagesToInsert);
              
              if (insertErr) {
                console.error(`Error inserting messages for ${phoneNumber}:`, insertErr);
                errorsCount++;
              } else {
                // Update conversation with last message info
                const lastMsg = messagesToInsert[messagesToInsert.length - 1];
                await supabase
                  .from('inbox_conversations')
                  .update({
                    last_message: lastMsg.content,
                    last_message_at: lastMsg.created_at,
                    unread_count: messagesToInsert.filter((m: any) => m.sender_type === 'contact').length,
                  })
                  .eq('id', conversationId);
                
                syncedCount++;
              }
            } else {
              syncedCount++;
            }
          } catch (chatErr) {
            console.error('Error processing chat:', chatErr);
            errorsCount++;
          }
        }
        
        console.log(`Sync complete: ${syncedCount} synced, ${errorsCount} errors`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: syncedCount,
            errors: errorsCount,
            total_chats: chats.length,
            message: `${syncedCount} conversas sincronizadas`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    console.error('Evolution API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
