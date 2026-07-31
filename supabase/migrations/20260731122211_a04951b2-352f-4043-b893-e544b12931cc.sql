CREATE SEQUENCE IF NOT EXISTS public.recibo_numero_seq START WITH 60 INCREMENT BY 1;

CREATE TABLE public.recibos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL DEFAULT nextval('public.recibo_numero_seq'),
  codigo text NOT NULL GENERATED ALWAYS AS (lpad(numero::text, 3, '0') || '/440/26') STORED,
  re text NOT NULL,
  nome text NOT NULL,
  posto text NOT NULL DEFAULT '',
  data date NOT NULL DEFAULT current_date,
  responsavel text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recibos_numero_unico UNIQUE (numero)
);

ALTER SEQUENCE public.recibo_numero_seq OWNED BY public.recibos.numero;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recibos TO authenticated;
GRANT ALL ON public.recibos TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.recibo_numero_seq TO authenticated;
GRANT ALL ON SEQUENCE public.recibo_numero_seq TO service_role;

ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aprovados veem recibos" ON public.recibos
  FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Aprovados criam recibos" ON public.recibos
  FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Aprovados atualizam recibos" ON public.recibos
  FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Somente admin remove recibos" ON public.recibos
  FOR DELETE TO authenticated USING (public.is_approved(auth.uid()) AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER recibos_set_updated_at BEFORE UPDATE ON public.recibos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();