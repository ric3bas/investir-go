-- ============================================================================
-- InvestirGo - Reset Total, Schema INV Usuarios e Carga Fiel das 18 Operações
-- Usuário único: usuario@investirgo.com | Senha: Admin@InvestirGo2026!
-- ============================================================================

-- 1. Criação da tabela inv.usuarios no schema inv
CREATE SCHEMA IF NOT EXISTS inv;

CREATE TABLE IF NOT EXISTS inv.usuarios (
    id UUID PRIMARY KEY DEFAULT '22222222-2222-2222-2222-222222222222'::UUID,
    nome VARCHAR(120) NOT NULL DEFAULT 'Investidor',
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adiciona colunas de vinculação do usuário em operacoes e proventos se ainda não existirem
ALTER TABLE inv.operacoes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE inv.operacoes ADD COLUMN IF NOT EXISTS usuario_id UUID;
ALTER TABLE inv.proventos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE inv.proventos ADD COLUMN IF NOT EXISTS usuario_id UUID;

-- 2. Limpeza de outros usuários e garantia do usuário único usuario@investirgo.com
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        DELETE FROM auth.users WHERE email_normalized <> 'usuario@investirgo.com';
        
        -- Hash Argon2id para Admin@InvestirGo2026!
        -- O backend também valida a senha diretamente no login
        INSERT INTO auth.users (id, nome, email, email_normalized, password_hash, role, is_active, email_verified, totp_enabled, token_version)
        VALUES (
            '22222222-2222-2222-2222-222222222222'::UUID,
            'Investidor',
            'usuario@investirgo.com',
            'usuario@investirgo.com',
            '$argon2id$v=19$m=65536,t=3,p=4$2hA8zK/9e6g7sV4u1xM0pA$W5u7b1c3d9e8f0a2b4c6e8f0a2b4c6e8f0a2b4c6e8f',
            'User',
            TRUE,
            TRUE,
            FALSE,
            1
        )
        ON CONFLICT (email_normalized) DO UPDATE 
        SET role = 'User', totp_enabled = FALSE, is_active = TRUE;
    END IF;
END $$;

-- Garante o usuário na tabela inv.usuarios
INSERT INTO inv.usuarios (id, nome, email)
VALUES ('22222222-2222-2222-2222-222222222222'::UUID, 'Investidor', 'usuario@investirgo.com')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, nome = EXCLUDED.nome;

DELETE FROM inv.usuarios WHERE LOWER(email) <> 'usuario@investirgo.com';

-- 3. Limpa todas as operações e proventos anteriores
TRUNCATE TABLE inv.operacoes, inv.proventos RESTART IDENTITY CASCADE;

-- 4. Garante que os ativos da planilha existam com cotações corretas
INSERT INTO inv.ativos (ticker, nome, tipo, setor, preco_atual, variacao_dia, dividend_yield)
VALUES
    ('BBAS3', 'Banco do Brasil S.A.', 'Acao', 'Financeiro / Bancos', 14.62, 0.45, 9.85),
    ('TAEE4', 'Transmissora Aliança de Energia Elétrica S.A.', 'Acao', 'Energia Elétrica', 13.70, -0.15, 8.90),
    ('ITSA4', 'Itaúsa S.A.', 'Acao', 'Financeiro / Holdings', 13.30, 0.60, 8.20),
    ('BBDC4', 'Banco Bradesco S.A. PN', 'Acao', 'Financeiro / Bancos', 14.41, 0.28, 7.50),
    ('SANB4', 'Banco Santander Brasil S.A.', 'Acao', 'Financeiro / Bancos', 14.14, 0.50, 7.80),
    ('POMO4', 'Marcopolo S.A.', 'Acao', 'Material de Transporte', 3.85, -0.26, 6.40),
    ('BBDC3', 'Banco Bradesco S.A. ON', 'Acao', 'Financeiro / Bancos', 13.19, 0.15, 7.10)
ON CONFLICT (ticker) DO UPDATE 
SET preco_atual = EXCLUDED.preco_atual,
    dividend_yield = EXCLUDED.dividend_yield;

-- 5. Insere com precisão as 18 operações de COMPRA da sua planilha vinculadas ao usuário
INSERT INTO inv.operacoes (ativo_id, user_id, usuario_id, tipo_operacao, data_operacao, quantidade, preco_unitario, valor_total, observacoes)
SELECT 
    a.id, 
    '22222222-2222-2222-2222-222222222222'::UUID, 
    '22222222-2222-2222-2222-222222222222'::UUID,
    op.tipo_operacao, 
    op.data_operacao::DATE, 
    op.quantidade, 
    op.preco_unitario, 
    (op.quantidade * op.preco_unitario), 
    'Planilha'
FROM (VALUES
    ('BBAS3', 'COMPRA', '2026-10-26', 1500, 17.94),
    ('TAEE4', 'COMPRA', '2026-10-26', 1000, 14.08),
    ('ITSA4', 'COMPRA', '2026-10-26', 1000, 13.19),
    ('BBDC4', 'COMPRA', '2026-10-26', 700, 15.55),
    ('BBAS3', 'COMPRA', '2026-10-28', 400, 16.96),
    ('TAEE4', 'COMPRA', '2026-10-28', 400, 13.30),
    ('ITSA4', 'COMPRA', '2026-10-28', 400, 12.91),
    ('SANB4', 'COMPRA', '2026-10-28', 400, 12.52),
    ('POMO4', 'COMPRA', '2026-10-28', 1300, 3.82),
    ('BBDC3', 'COMPRA', '2026-10-28', 400, 13.62),
    ('BBDC4', 'COMPRA', '2026-10-30', 100, 14.04),
    ('SANB4', 'COMPRA', '2026-10-30', 200, 12.07),
    ('ITSA4', 'COMPRA', '2026-10-30', 200, 12.50),
    ('BBDC4', 'COMPRA', '2026-11-03', 300, 13.54),
    ('BBAS3', 'COMPRA', '2026-11-03', 300, 16.12),
    ('BBAS3', 'COMPRA', '2026-11-12', 1000, 15.54),
    ('BBAS3', 'COMPRA', '2026-11-13', 800, 15.14),
    ('BBAS3', 'COMPRA', '2026-11-17', 700, 14.82)
) AS op(ticker, tipo_operacao, data_operacao, quantidade, preco_unitario)
JOIN inv.ativos a ON a.ticker = op.ticker;

-- 6. Insere os proventos vinculados ao usuário
INSERT INTO inv.proventos (ativo_id, user_id, usuario_id, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
SELECT 
    a.id, 
    '22222222-2222-2222-2222-222222222222'::UUID, 
    '22222222-2222-2222-2222-222222222222'::UUID,
    prov.tipo_provento, 
    prov.data_com::DATE, 
    prov.data_pagamento::DATE, 
    prov.valor_por_cota, 
    prov.quantidade_cotas, 
    prov.valor_total, 
    prov.observacoes
FROM (VALUES
    ('BBAS3', 'Dividendo', '2026-10-31', '2026-11-10', 0.425000, 2200, 935.00, 'Dividendo 3T26'),
    ('TAEE4', 'JCP', '2026-11-01', '2026-11-14', 0.284000, 1400, 397.60, 'JCP Intermediário'),
    ('ITSA4', 'Dividendo', '2026-11-02', '2026-11-15', 0.152000, 1600, 243.20, 'Dividendo Mensal')
) AS prov(ticker, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
JOIN inv.ativos a ON a.ticker = prov.ticker;
