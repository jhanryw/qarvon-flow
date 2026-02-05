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
      action: 'create_instance' | 'get_qr' | 'get_status' | 'logout' | 'delete_instance' | 'send_message' | 'fetch_instances';
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
    
    switch (action) {
      case 'create_instance': {
          const createUrl = `${apiUrl}/instance/create`;
          console.log(`Creating instance at: ${createUrl}`);
          
          // Try with apikey header first (Evolution API v2 format)
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
              }),
            });
            data = await response.json();
            console.log('Create instance response (Bearer):', JSON.stringify(data));
          }
    
        if (!response.ok) {
          const evolutionError = extractEvolutionError(data) || 'Failed to create instance';
          const evolutionErrorLower = evolutionError.toLowerCase();

          // Name already taken: return a 409 so the frontend can ask for a different name
          if (evolutionErrorLower.includes('already in use') || evolutionErrorLower.includes('já está em uso')) {
            return new Response(
              JSON.stringify({
                success: false,
                error: evolutionError,
                code: 'INSTANCE_NAME_IN_USE',
              }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Check if instance already exists
          // (Evolution v2 sometimes returns nested messages: data.response.message)
          if (evolutionErrorLower.includes('already') || evolutionErrorLower.includes('exists')) {
            // Try to get QR code instead
            const qrResponse = await fetch(`${apiUrl}/instance/connect/${instance_name}`, {
              method: 'GET',
              headers: { 'apikey': EVOLUTION_API_KEY },
            });
            const qrData = await qrResponse.json();
            
            return new Response(
              JSON.stringify({ 
                success: true, 
                qr_code: qrData.base64 || qrData.qrcode?.base64,
                instance: instance_name,
                message: 'Instance already exists, QR code generated'
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

        // Update channel config with instance info
        if (channel_id) {
          // Extract base64 if it already contains the prefix, or add it
          let qrCodeValue = data.qrcode?.base64 || null;
          if (qrCodeValue && !qrCodeValue.startsWith('data:')) {
            qrCodeValue = `data:image/png;base64,${qrCodeValue}`;
          }
          
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

        // Return qr_code: already has prefix or add it
        let returnQrCode = data.qrcode?.base64 || null;
        if (returnQrCode && !returnQrCode.startsWith('data:')) {
          returnQrCode = `data:image/png;base64,${returnQrCode}`;
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            qr_code: returnQrCode,
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
