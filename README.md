# 🐟 RJ Peixaria CRM

CRM de Gerenciamento de Atendimento para peixarias, integrado com Supabase e Z-API.

## 🚀 Como Iniciar

### 1. Requisitos
- Node.js 18+
- Projeto no Supabase
- Instância na Z-API

### 2. Instalação
```bash
npm install
```

### 3. Configuração (.env)
Crie um arquivo `.env` na raiz com:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key

VITE_ZAPI_INSTANCE_ID=seu_id
VITE_ZAPI_TOKEN=seu_token
VITE_ZAPI_CLIENT_TOKEN=seu_client_token
```

### 4. Execução
```bash
npm run dev
```

---

## 🛠️ Scripts SQL para Supabase

Execute os comandos abaixo no **SQL Editor** do seu projeto Supabase:

### 1. Criação das Tabelas
```sql
CREATE TABLE IF NOT EXISTS loja_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  endereco TEXT,
  horario_funcionamento JSONB,
  servicos TEXT[],
  formas_pagamento TEXT[],
  chaves_pix JSONB,
  politicas TEXT,
  raio_entrega_km DECIMAL(5,2),
  taxa_entrega DECIMAL(10,2),
  telefone TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT,
  produtos_pedidos JSONB NOT NULL DEFAULT '[]',
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  endereco_entrega TEXT,
  forma_pagamento TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','confirmado','pronto_retirada','entregue','cancelado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  nome_cliente TEXT,
  telefone TEXT NOT NULL,
  status TEXT DEFAULT 'bot' CHECK (status IN ('bot','humano','encerrado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL REFERENCES conversas(session_id) ON DELETE CASCADE,
  remetente TEXT NOT NULL CHECK (remetente IN ('bot','cliente','atendente')),
  mensagem TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  quantidade TEXT,
  categoria TEXT,
  disponivel BOOLEAN DEFAULT true
);
```

### 2. Políticas RLS
```sql
ALTER TABLE loja_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total Autenticado" ON loja_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Autenticado" ON pedidos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Autenticado" ON conversas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Autenticado" ON mensagens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Autenticado" ON produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 3. Realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE conversas;
```

### 4. Índices
```sql
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversas_updated_at ON conversas(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_session_id ON mensagens(session_id);
```
