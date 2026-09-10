CREATE POLICY "audit_insert_self" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
GRANT INSERT ON public.audit_log TO authenticated;