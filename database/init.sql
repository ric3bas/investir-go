-- Database Initialization for Investir-Go
CREATE SCHEMA IF NOT EXISTS inv; 
-- Table: Usuarios no schema inv
CREATE TABLE IF NOT EXISTS inv.usuarios (
    id UUID PRIMARY KEY DEFAULT '22222222-2222-2222-2222-222222222222'::UUID,
    nome VARCHAR(120) NOT NULL DEFAULT 'Investidor',
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserção do usuário padrão no schema inv
INSERT INTO inv.usuarios (id, nome, email)
VALUES ('22222222-2222-2222-2222-222222222222'::UUID, 'Investidor', 'usuario@investirgo.com')
ON CONFLICT (id) DO NOTHING;

-- Table: Ativos (Acoes e Fundos Imobiliarios)
CREATE TABLE IF NOT EXISTS inv.ativos (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(12) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'Acao', 'FII', 'BDR', 'ETF'
    setor VARCHAR(80),
    preco_atual NUMERIC(15, 4) NOT NULL DEFAULT 0.00,
    variacao_dia NUMERIC(8, 4) DEFAULT 0.00,
    dividend_yield NUMERIC(8, 4) DEFAULT 0.00,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Operacoes (Compras e Vendas)
CREATE TABLE IF NOT EXISTS inv.operacoes (
    id SERIAL PRIMARY KEY,
    ativo_id INT NOT NULL REFERENCES inv.ativos(id) ON DELETE RESTRICT,
    usuario_id UUID REFERENCES inv.usuarios(id) ON DELETE CASCADE,
    user_id UUID,
    tipo_operacao VARCHAR(10) NOT NULL CHECK (tipo_operacao IN ('COMPRA', 'VENDA')),
    data_operacao DATE NOT NULL,
    quantidade NUMERIC(15, 4) NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(15, 4) NOT NULL CHECK (preco_unitario > 0),
    valor_total NUMERIC(15, 4) NOT NULL,
    taxas NUMERIC(15, 4) DEFAULT 0.00,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Proventos (Dividendos, JCP, Rendimentos FII, Amortizacao)
CREATE TABLE IF NOT EXISTS inv.proventos (
    id SERIAL PRIMARY KEY,
    ativo_id INT NOT NULL REFERENCES inv.ativos(id) ON DELETE RESTRICT,
    usuario_id UUID REFERENCES inv.usuarios(id) ON DELETE CASCADE,
    user_id UUID,
    tipo_provento VARCHAR(30) NOT NULL CHECK (tipo_provento IN ('Dividendo', 'JCP', 'Rendimento', 'Amortizacao')),
    data_com DATE,
    data_pagamento DATE NOT NULL,
    valor_por_cota NUMERIC(15, 6) NOT NULL DEFAULT 0.00,
    quantidade_cotas NUMERIC(15, 4) NOT NULL DEFAULT 0,
    valor_total NUMERIC(15, 4) NOT NULL CHECK (valor_total >= 0),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_operacoes_ativo_data ON inv.operacoes(ativo_id, data_operacao);
CREATE INDEX IF NOT EXISTS idx_proventos_ativo_data ON inv.proventos(ativo_id, data_pagamento);
CREATE INDEX IF NOT EXISTS idx_ativos_ticker ON inv.ativos(ticker);

-- SEED: Top 30 Ativos (15 Melhores Ações + 15 Melhores FIIs da Bolsa B3)
INSERT INTO inv.ativos (ticker, nome, tipo, setor, preco_atual, variacao_dia, dividend_yield)
VALUES
    -- 15 Melhores Ações
    ('BBAS3', 'Banco do Brasil S.A.', 'Acao', 'Financeiro / Bancos', 14.62, 0.45, 9.85),
    ('TAEE4', 'Transmissora Aliança de Energia Elétrica S.A.', 'Acao', 'Energia Elétrica', 13.70, -0.15, 8.90),
    ('ITSA4', 'Itaúsa S.A.', 'Acao', 'Financeiro / Holdings', 13.30, 0.60, 8.20),
    ('BBDC4', 'Banco Bradesco S.A. PN', 'Acao', 'Financeiro / Bancos', 14.41, 0.28, 7.50),
    ('SANB4', 'Banco Santander Brasil S.A.', 'Acao', 'Financeiro / Bancos', 14.14, 0.50, 7.80),
    ('POMO4', 'Marcopolo S.A.', 'Acao', 'Material de Transporte', 3.85, -0.26, 6.40),
    ('BBDC3', 'Banco Bradesco S.A. ON', 'Acao', 'Financeiro / Bancos', 13.19, 0.15, 7.10),
    ('PETR4', 'Petróleo Brasileiro S.A. Petrobras', 'Acao', 'Petróleo, Gás e Biocombustíveis', 37.85, 1.20, 14.20),
    ('VALE3', 'Vale S.A.', 'Acao', 'Mineração', 58.20, -0.80, 8.40),
    ('ITUB4', 'Itaú Unibanco Holding S.A.', 'Acao', 'Financeiro / Bancos', 34.60, 0.75, 7.90),
    ('TAEE11', 'Taesa Unit', 'Acao', 'Energia Elétrica', 34.80, 0.10, 9.10),
    ('WEGE3', 'WEG S.A.', 'Acao', 'Motores e Equipamentos Elétricos', 52.40, 1.45, 1.80),
    ('ABEV3', 'Ambev S.A.', 'Acao', 'Bebidas', 12.80, -0.30, 6.20),
    ('RENT3', 'Localiza Rent a Car S.A.', 'Acao', 'Locação de Veículos', 44.50, 0.90, 3.50),
    ('PRIO3', 'PRIO S.A.', 'Acao', 'Petróleo e Gás Independente', 42.10, 2.10, 0.00),

    -- 15 Melhores Fundos Imobiliários (FIIs)
    ('MXRF11', 'Maxi Renda FII', 'FII', 'Papel / CRI', 10.15, 0.10, 12.40),
    ('HGLG11', 'CSHG Logística FII', 'FII', 'Logística / Galpões', 161.50, 0.35, 8.60),
    ('XPML11', 'XP Malls FII', 'FII', 'Shopping Centers', 107.20, 0.20, 9.10),
    ('KNIP11', 'Kinea Índices de Preços FII', 'FII', 'Papel / IPCA', 91.80, -0.10, 10.80),
    ('KNCR11', 'Kinea Rendimentos Imobiliários FII', 'FII', 'Papel / CDI', 104.30, 0.05, 12.60),
    ('BTLG11', 'BTG Pactual Logística FII', 'FII', 'Logística / Galpões', 99.40, 0.40, 9.30),
    ('VISC11', 'Vinci Shopping Centers FII', 'FII', 'Shopping Centers', 114.80, 0.15, 8.95),
    ('HGRU11', 'CSHG Renda Urbana FII', 'FII', 'Renda Urbana / Educacional', 124.60, 0.25, 9.20),
    ('CPTS11', 'Capitânia Securities II FII', 'FII', 'Papel / CRI', 7.95, -0.25, 11.90),
    ('VGHF11', 'Valora Hedge Fund FII', 'FII', 'Hedge Fund Imobiliário', 3.00, 0.00, 12.80),
    ('TGAR11', 'TG Ativo Real FII', 'FII', 'Desenvolvimento / Loteamentos', 118.50, 0.30, 13.50),
    ('KNHY11', 'Kinea High Yield FII', 'FII', 'Papel / High Yield', 99.20, 0.10, 12.10),
    ('XPLG11', 'XP Log FII', 'FII', 'Logística / Galpões', 102.10, 0.18, 8.70),
    ('TRXF11', 'TRX Real Estate FII', 'FII', 'Renda Urbana / Imóveis Comerciais', 105.80, 0.45, 9.80),
    ('ALZR11', 'Alianza Trust Renda Imobiliária FII', 'FII', 'Híbrido / Renda Urbana', 103.50, 0.20, 8.85)
ON CONFLICT (ticker) DO NOTHING;
-- ============================================================================
-- InvestirGo - Módulo de Autenticação e Autorização Segura
-- PostgreSQL Schema & Migrations
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

-- ----------------------------------------------------------------------------
-- 1. Tabela de Usuários (auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    email_normalized VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Formato Modular Crypt Argon2id
    role VARCHAR(50) NOT NULL DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    token_version INT NOT NULL DEFAULT 1, -- Incrementado em troca/recuperação de senha para revogação em tempo real
    totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    totp_secret_encrypted TEXT NULL, -- Chave Base32 criptografada com AES-256-GCM
    last_totp_step BIGINT NULL, -- Prevenção contra reutilização/replay de código TOTP
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email_normalized ON auth.users(email_normalized);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);

-- ----------------------------------------------------------------------------
-- 2. Tabela de Sessões e Refresh Tokens (auth.user_sessions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_family_id UUID NOT NULL, -- Identificador da família de sessão para detecção de reuso
    refresh_token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 em Hex do token aleatório de 256 bits
    previous_token_hash VARCHAR(64) NULL, -- Hash do token anterior para tolerância de concorrência restrita
    previous_token_rotated_at TIMESTAMP WITH TIME ZONE NULL,
    user_agent TEXT NULL,
    ip_address VARCHAR(45) NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_reason VARCHAR(100) NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Expiração absoluta (ex: 7 dias)
    idle_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Expiração por inatividade (ex: 24 horas)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON auth.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_family ON auth.user_sessions(session_family_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON auth.user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_prev_token_hash ON auth.user_sessions(previous_token_hash);

-- ----------------------------------------------------------------------------
-- 3. Tabela de Tokens Temporários (auth.user_tokens)
-- Verificação de E-mail e Redefinição de Senha
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth.user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'MFA_CHALLENGE')),
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 do token opaco
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE NULL, -- Consumo atômico de uso único
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_tokens_lookup ON auth.user_tokens(token_type, token_hash);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON auth.user_tokens(user_id);

-- ----------------------------------------------------------------------------
-- 4. Tabela de Códigos de Recuperação MFA (auth.mfa_recovery_codes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth.mfa_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash VARCHAR(64) NOT NULL, -- SHA-256 do código de recuperação
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON auth.mfa_recovery_codes(user_id, code_hash);

-- ----------------------------------------------------------------------------
-- 5. Tabela de Auditoria de Segurança (auth.audit_logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SUSPICIOUS')),
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    details TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON auth.audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON auth.audit_logs(created_at);

-- ----------------------------------------------------------------------------
-- 6. Adição de user_id nas tabelas existentes para controle de acesso por recurso (IDOR)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'inv' AND table_name = 'operacoes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE inv.operacoes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_operacoes_user_id ON inv.operacoes(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'inv' AND table_name = 'proventos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE inv.proventos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_proventos_user_id ON inv.proventos(user_id);
    END IF;
END $$;
