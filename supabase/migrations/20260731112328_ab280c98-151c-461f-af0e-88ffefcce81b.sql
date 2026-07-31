-- entregas: keep approved-only access, restrict deletes to admins
DROP POLICY IF EXISTS "Aprovados removem entregas" ON public.entregas;
CREATE POLICY "Somente admin remove entregas"
ON public.entregas FOR DELETE TO authenticated
USING (public.is_approved(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- ensure no anon access remains
REVOKE ALL ON public.entregas FROM anon;
REVOKE ALL ON public.historico FROM anon;

-- entregas: re-assert approved-only read/write
DROP POLICY IF EXISTS "Aprovados veem entregas" ON public.entregas;
CREATE POLICY "Aprovados veem entregas"
ON public.entregas FOR SELECT TO authenticated
USING (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Aprovados inserem entregas" ON public.entregas;
CREATE POLICY "Aprovados inserem entregas"
ON public.entregas FOR INSERT TO authenticated
WITH CHECK (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Aprovados atualizam entregas" ON public.entregas;
CREATE POLICY "Aprovados atualizam entregas"
ON public.entregas FOR UPDATE TO authenticated
USING (public.is_approved(auth.uid()))
WITH CHECK (public.is_approved(auth.uid()));

-- historico: approved-only, append-only
DROP POLICY IF EXISTS "Aprovados veem historico" ON public.historico;
CREATE POLICY "Aprovados veem historico"
ON public.historico FOR SELECT TO authenticated
USING (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Aprovados registram historico" ON public.historico;
CREATE POLICY "Aprovados registram historico"
ON public.historico FOR INSERT TO authenticated
WITH CHECK (public.is_approved(auth.uid()));