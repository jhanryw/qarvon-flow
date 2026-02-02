-- Add column to track lead creation source (manual vs whatsapp/instagram)
ALTER TABLE public.leads 
ADD COLUMN criado_via TEXT DEFAULT 'manual' CHECK (criado_via IN ('manual', 'whatsapp', 'instagram', 'webhook'));

-- Add comment for clarity
COMMENT ON COLUMN public.leads.criado_via IS 'Origem do cadastro: manual (pelo usuário), whatsapp, instagram, ou webhook';