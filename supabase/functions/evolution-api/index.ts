import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequestBody {
  action: 'create_instance' | 'get_qr' | 'get_status' | 'logout' | 'delete_instance' | 'send_message';
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body: RequestBody = await req.json();
    const { action, instance_name, channel_id, message, phone } = body;

    // Normalize API URL (remove trailing slash)
    const apiUrl = EVOLUTION_API_URL.replace(/\/$/, '');

    console.log(`Evolution API action: ${action} for instance: ${instance_name}`);

    switch (action) {
      case 'create_instance': {
        // Create a new instance in Evolution API
        const response = await fetch(`${apiUrl}/instance/create`, {
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

        const data = await response.json();
        console.log('Create instance response:', JSON.stringify(data));

        if (!response.ok) {
          // Check if instance already exists
          if (data.message?.includes('already') || data.error?.includes('already')) {
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
          throw new Error(data.message || 'Failed to create instance');
        }

        // Update channel config with instance info
        if (channel_id) {
          await supabase
            .from('seller_channels')
            .update({
              config: {
                status: 'qr_ready',
                qr_code: data.qrcode?.base64 ? `data:image/png;base64,${data.qrcode.base64}` : null,
                evolution_instance: instance_name,
              }
            })
            .eq('id', channel_id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            qr_code: data.qrcode?.base64 ? `data:image/png;base64,${data.qrcode.base64}` : null,
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

        // Update channel config
        if (channel_id && qrBase64) {
          await supabase
            .from('seller_channels')
            .update({
              config: {
                status: 'qr_ready',
                qr_code: `data:image/png;base64,${qrBase64}`,
                evolution_instance: instance_name,
              }
            })
            .eq('id', channel_id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            qr_code: qrBase64 ? `data:image/png;base64,${qrBase64}` : null,
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
