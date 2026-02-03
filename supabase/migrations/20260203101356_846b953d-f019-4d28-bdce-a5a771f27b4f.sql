-- Allow admins and financeiro to delete transactions
CREATE POLICY "Admins e financeiro podem deletar transações"
ON public.transactions
FOR DELETE
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'financeiro'::app_role));