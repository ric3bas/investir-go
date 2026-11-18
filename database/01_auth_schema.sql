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
-- 6. Adição de usuario_id e user_id no schema inv para controle de acesso (IDOR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inv.usuarios (
    id UUID PRIMARY KEY DEFAULT '22222222-2222-2222-2222-222222222222'::UUID,
    nome VARCHAR(120) NOT NULL DEFAULT 'Investidor',
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO inv.usuarios (id, nome, email)
VALUES ('22222222-2222-2222-2222-222222222222'::UUID, 'Investidor', 'usuario@investirgo.com')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, nome = EXCLUDED.nome;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'inv' AND table_name = 'operacoes' AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE inv.operacoes ADD COLUMN usuario_id UUID REFERENCES inv.usuarios(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_operacoes_usuario_id ON inv.operacoes(usuario_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'inv' AND table_name = 'operacoes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE inv.operacoes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_operacoes_user_id ON inv.operacoes(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'inv' AND table_name = 'proventos' AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE inv.proventos ADD COLUMN usuario_id UUID REFERENCES inv.usuarios(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_proventos_usuario_id ON inv.proventos(usuario_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'inv' AND table_name = 'proventos' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE inv.proventos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_proventos_user_id ON inv.proventos(user_id);
    END IF;
END $$;
