-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'aprovado');
$$;

-- bootstrap: primeiro usuario vira admin aprovado, demais ficam pendentes
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  existe_admin boolean;
BEGIN
  NEW.id := auth.uid();
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO existe_admin;
  IF existe_admin THEN
    NEW.status := 'pendente';
  ELSE
    NEW.status := 'aprovado';
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_before_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- policies profiles
CREATE POLICY "Ver proprio perfil ou admin ve todos" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Criar apenas o proprio perfil" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Somente admin altera perfis" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Somente admin remove perfis" ON public.profiles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- policies user_roles
CREATE POLICY "Ver proprios papeis ou admin ve todos" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Somente admin concede papeis" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Somente admin remove papeis" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- exigir conta aprovada nas tabelas existentes
DROP POLICY IF EXISTS "Entregas visiveis para autenticados" ON public.entregas;
DROP POLICY IF EXISTS "Autenticados inserem entregas" ON public.entregas;
DROP POLICY IF EXISTS "Autenticados atualizam entregas" ON public.entregas;
DROP POLICY IF EXISTS "Autenticados removem entregas" ON public.entregas;

CREATE POLICY "Aprovados veem entregas" ON public.entregas
FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Aprovados inserem entregas" ON public.entregas
FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Aprovados atualizam entregas" ON public.entregas
FOR UPDATE TO authenticated USING (public.is_approved(auth.uid())) WITH CHECK (public.is_approved(auth.uid()));
CREATE POLICY "Aprovados removem entregas" ON public.entregas
FOR DELETE TO authenticated USING (public.is_approved(auth.uid()));

DROP POLICY IF EXISTS "Historico visivel para autenticados" ON public.historico;
DROP POLICY IF EXISTS "Autenticados registram historico" ON public.historico;

CREATE POLICY "Aprovados veem historico" ON public.historico
FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY "Aprovados registram historico" ON public.historico
FOR INSERT TO authenticated WITH CHECK (public.is_approved(auth.uid()));