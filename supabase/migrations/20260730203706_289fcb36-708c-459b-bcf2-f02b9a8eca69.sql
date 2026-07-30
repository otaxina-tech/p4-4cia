CREATE TABLE public.entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  re text NOT NULL,
  nome text NOT NULL,
  posto text NOT NULL DEFAULT '',
  material text NOT NULL,
  entrega date NOT NULL,
  validade date NOT NULL,
  responsavel text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (re, material)
);

GRANT SELECT ON public.entregas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entregas TO authenticated;
GRANT ALL ON public.entregas TO service_role;

ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entregas visiveis para todos" ON public.entregas FOR SELECT USING (true);
CREATE POLICY "Usuarios logados inserem entregas" ON public.entregas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios logados atualizam entregas" ON public.entregas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Usuarios logados removem entregas" ON public.entregas FOR DELETE TO authenticated USING (true);

CREATE TABLE public.historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data timestamptz NOT NULL DEFAULT now(),
  re text NOT NULL,
  nome text NOT NULL,
  material text NOT NULL,
  entrega date NOT NULL,
  validade date NOT NULL,
  responsavel text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT ''
);

GRANT SELECT ON public.historico TO anon;
GRANT SELECT, INSERT ON public.historico TO authenticated;
GRANT ALL ON public.historico TO service_role;

ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Historico visivel para todos" ON public.historico FOR SELECT USING (true);
CREATE POLICY "Usuarios logados registram historico" ON public.historico FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER entregas_set_updated_at
BEFORE UPDATE ON public.entregas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();