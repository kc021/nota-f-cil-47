-- Create enum types
CREATE TYPE public.tax_regime AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real');
CREATE TYPE public.invoice_status AS ENUM ('rascunho', 'pendente', 'autorizada', 'cancelada', 'rejeitada');
CREATE TYPE public.invoice_environment AS ENUM ('homologacao', 'producao');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Companies table (emitentes)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT NOT NULL,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario tax_regime NOT NULL DEFAULT 'simples_nacional',
  -- Address
  cep TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  codigo_municipio TEXT NOT NULL,
  -- Certificate
  certificate_file_path TEXT,
  certificate_password_hash TEXT,
  -- Environment
  ambiente invoice_environment NOT NULL DEFAULT 'homologacao',
  numero_nfe_atual INTEGER NOT NULL DEFAULT 0,
  serie_nfe INTEGER NOT NULL DEFAULT 1,
  --
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients table (destinatários)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('cpf', 'cnpj')),
  documento TEXT NOT NULL,
  nome TEXT NOT NULL,
  inscricao_estadual TEXT,
  email TEXT,
  telefone TEXT,
  -- Address
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  codigo_municipio TEXT,
  --
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ncm TEXT NOT NULL,
  cfop TEXT NOT NULL,
  cst TEXT,
  csosn TEXT,
  unidade TEXT NOT NULL,
  valor_unitario DECIMAL(15, 4) NOT NULL,
  origem TEXT NOT NULL DEFAULT '0',
  -- Taxes
  icms_aliquota DECIMAL(5, 2),
  ipi_aliquota DECIMAL(5, 2),
  pis_aliquota DECIMAL(5, 4),
  cofins_aliquota DECIMAL(5, 4),
  --
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices table (NF-e)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  -- NF-e info
  numero INTEGER NOT NULL,
  serie INTEGER NOT NULL,
  chave_acesso TEXT,
  protocolo_autorizacao TEXT,
  data_emissao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_autorizacao TIMESTAMPTZ,
  -- Status
  status invoice_status NOT NULL DEFAULT 'rascunho',
  ambiente invoice_environment NOT NULL,
  -- Values
  valor_produtos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_frete DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_seguro DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_desconto DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_outras_despesas DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  -- Taxes
  valor_icms DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_ipi DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_pis DECIMAL(15, 2) NOT NULL DEFAULT 0,
  valor_cofins DECIMAL(15, 2) NOT NULL DEFAULT 0,
  -- Additional info
  natureza_operacao TEXT NOT NULL DEFAULT 'Venda de Mercadoria',
  informacoes_complementares TEXT,
  -- XML and PDF
  xml_path TEXT,
  danfe_path TEXT,
  -- Cancellation
  motivo_cancelamento TEXT,
  data_cancelamento TIMESTAMPTZ,
  --
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(company_id, numero, serie)
);

-- Invoice items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  numero_item INTEGER NOT NULL,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ncm TEXT NOT NULL,
  cfop TEXT NOT NULL,
  unidade TEXT NOT NULL,
  quantidade DECIMAL(15, 4) NOT NULL,
  valor_unitario DECIMAL(15, 4) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  -- Taxes
  cst TEXT,
  csosn TEXT,
  origem TEXT NOT NULL DEFAULT '0',
  icms_base DECIMAL(15, 2) NOT NULL DEFAULT 0,
  icms_aliquota DECIMAL(5, 2) NOT NULL DEFAULT 0,
  icms_valor DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ipi_base DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ipi_aliquota DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ipi_valor DECIMAL(15, 2) NOT NULL DEFAULT 0,
  pis_base DECIMAL(15, 2) NOT NULL DEFAULT 0,
  pis_aliquota DECIMAL(5, 4) NOT NULL DEFAULT 0,
  pis_valor DECIMAL(15, 2) NOT NULL DEFAULT 0,
  cofins_base DECIMAL(15, 2) NOT NULL DEFAULT 0,
  cofins_aliquota DECIMAL(5, 4) NOT NULL DEFAULT 0,
  cofins_valor DECIMAL(15, 2) NOT NULL DEFAULT 0,
  --
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Correction letters table (CC-e)
CREATE TABLE public.correction_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  numero_sequencia INTEGER NOT NULL,
  correcao TEXT NOT NULL,
  protocolo TEXT,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_letters ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Companies policies
CREATE POLICY "Users can view own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);

-- Helper function to check company ownership
CREATE OR REPLACE FUNCTION public.user_owns_company(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = company_uuid AND user_id = auth.uid()
  )
$$;

-- Clients policies
CREATE POLICY "Users can view clients of own companies"
  ON public.clients FOR SELECT
  USING (public.user_owns_company(company_id));

CREATE POLICY "Users can create clients for own companies"
  ON public.clients FOR INSERT
  WITH CHECK (public.user_owns_company(company_id));

CREATE POLICY "Users can update clients of own companies"
  ON public.clients FOR UPDATE
  USING (public.user_owns_company(company_id));

CREATE POLICY "Users can delete clients of own companies"
  ON public.clients FOR DELETE
  USING (public.user_owns_company(company_id));

-- Products policies
CREATE POLICY "Users can view products of own companies"
  ON public.products FOR SELECT
  USING (public.user_owns_company(company_id));

CREATE POLICY "Users can create products for own companies"
  ON public.products FOR INSERT
  WITH CHECK (public.user_owns_company(company_id));

CREATE POLICY "Users can update products of own companies"
  ON public.products FOR UPDATE
  USING (public.user_owns_company(company_id));

CREATE POLICY "Users can delete products of own companies"
  ON public.products FOR DELETE
  USING (public.user_owns_company(company_id));

-- Invoices policies
CREATE POLICY "Users can view invoices of own companies"
  ON public.invoices FOR SELECT
  USING (public.user_owns_company(company_id));

CREATE POLICY "Users can create invoices for own companies"
  ON public.invoices FOR INSERT
  WITH CHECK (public.user_owns_company(company_id));

CREATE POLICY "Users can update invoices of own companies"
  ON public.invoices FOR UPDATE
  USING (public.user_owns_company(company_id));

CREATE POLICY "Users can delete invoices of own companies"
  ON public.invoices FOR DELETE
  USING (public.user_owns_company(company_id));

-- Invoice items policies
CREATE POLICY "Users can view invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND public.user_owns_company(i.company_id)
    )
  );

CREATE POLICY "Users can create invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND public.user_owns_company(i.company_id)
    )
  );

CREATE POLICY "Users can update invoice items"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND public.user_owns_company(i.company_id)
    )
  );

CREATE POLICY "Users can delete invoice items"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND public.user_owns_company(i.company_id)
    )
  );

-- Correction letters policies
CREATE POLICY "Users can view correction letters"
  ON public.correction_letters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND public.user_owns_company(i.company_id)
    )
  );

CREATE POLICY "Users can create correction letters"
  ON public.correction_letters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND public.user_owns_company(i.company_id)
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_products_company_id ON public.products(company_id);
CREATE INDEX idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_correction_letters_invoice_id ON public.correction_letters(invoice_id);