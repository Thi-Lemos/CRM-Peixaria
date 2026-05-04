-- =============================================================
-- RJ Peixaria CRM — Script de Criação de Tabelas
-- Execute este script no SQL Editor do Supabase
-- =============================================================

-- 1. TABELA: loja_config
-- =============================================================
CREATE TABLE IF NOT EXISTS loja_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  endereco TEXT,
  horario_funcionamento JSONB,
  servicos TEXT[],
  formas_pagamento TEXT[],
  chaves_pix JSONB,
  politicas TEXT,
  taxas_entrega JSONB DEFAULT '[]'::jsonb,
  telefone TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA: pedidos
-- =============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT,
  produtos_pedidos JSONB NOT NULL DEFAULT '[]',
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  endereco_entrega TEXT,
  forma_pagamento TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','confirmado','pronto_retirada','entregue','cancelado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA: conversas
-- =============================================================
CREATE TABLE IF NOT EXISTS conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  nome_cliente TEXT,
  telefone TEXT NOT NULL,
  status TEXT DEFAULT 'bot'
    CHECK (status IN ('bot','humano','encerrado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA: mensagens
-- =============================================================
CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES conversas(session_id) ON DELETE CASCADE,
  remetente TEXT NOT NULL
    CHECK (remetente IN ('bot','cliente','atendente')),
  mensagem TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELA: atendimentos
-- =============================================================
CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  telefone TEXT,
  dentro_horario BOOLEAN,
  data_atendimento TIMESTAMPTZ DEFAULT now()
);

-- 6. COLUNA disponivel na tabela produtos (se já existir)
-- =============================================================
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT true;

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE loja_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Policies: acesso apenas para usuários autenticados
CREATE POLICY "Authenticated users — loja_config"
  ON loja_config FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users — pedidos"
  ON pedidos FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users — conversas"
  ON conversas FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users — mensagens"
  ON mensagens FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users — atendimentos"
  ON atendimentos FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users — produtos"
  ON produtos FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- =============================================================
-- INDEXES para performance
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_conversas_updated_at ON conversas(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_session_id ON mensagens(session_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON atendimentos(data_atendimento DESC);

-- =============================================================
-- REALTIME
-- Habilite nas tabelas abaixo via Dashboard do Supabase:
-- Database → Replication → Supabase Realtime
-- Tabelas: pedidos, mensagens, conversas
-- =============================================================
