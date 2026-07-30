-- entregas: restrict reads to authenticated users
DROP POLICY IF EXISTS "Entregas visiveis para todos" ON public.entregas;
DROP POLICY IF EXISTS "Usuarios logados atualizam entregas" ON public.entregas;
DROP POLICY IF EXISTS "Usuarios logados inserem entregas" ON public.entregas;
DROP POLICY IF EXISTS "Usuarios logados removem entregas" ON public.entregas;

REVOKE ALL ON public.entregas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entregas TO authenticated;
GRANT ALL ON public.entregas TO service_role;

CREATE POLICY "Entregas visiveis para autenticados"
  ON public.entregas FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados inserem entregas"
  ON public.entregas FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados atualizam entregas"
  ON public.entregas FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados removem entregas"
  ON public.entregas FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- historico: append-only, authenticated read
DROP POLICY IF EXISTS "Historico visivel para todos" ON public.historico;
DROP POLICY IF EXISTS "Usuarios logados registram historico" ON public.historico;

REVOKE ALL ON public.historico FROM anon;
REVOKE UPDATE, DELETE ON public.historico FROM authenticated;
GRANT SELECT, INSERT ON public.historico TO authenticated;
GRANT ALL ON public.historico TO service_role;

CREATE POLICY "Historico visivel para autenticados"
  ON public.historico FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados registram historico"
  ON public.historico FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Explicit deny for modification of historical records
CREATE POLICY "Historico nao pode ser alterado"
  ON public.historico FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Historico nao pode ser removido"
  ON public.historico FOR DELETE TO authenticated USING (false);