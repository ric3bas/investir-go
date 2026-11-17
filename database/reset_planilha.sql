-- ============================================================================
-- InvestirGo - Reset e Carga Fiel das 18 Operações da Planilha do Usuário
-- ============================================================================

-- 1. Limpa todas as operações e proventos anteriores e garante apenas o usuário comum
TRUNCATE TABLE inv.operacoes, inv.proventos RESTART IDENTITY CASCADE;
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
        DELETE FROM auth.users WHERE email_normalized <> 'usuario@investirgo.com';
        UPDATE auth.users SET totp_enabled = FALSE, role = 'User' WHERE email_normalized = 'usuario@investirgo.com';
    END IF;
END $$;

-- 2. Garante que os ativos da planilha existam com cotações corretas
INSERT INTO inv.ativos (ticker, nome, tipo, setor, preco_atual, variacao_dia, dividend_yield)
VALUES
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
    ('MXRF11', 'Maxi Renda FII', 'FII', 'Papel / CRI', 10.15, 0.10, 12.40),
    ('HGLG11', 'CSHG Logística FII', 'FII', 'Logística / Galpões', 161.50, 0.35, 8.60),
    ('XPML11', 'XP Malls FII', 'FII', 'Shopping Centers', 107.20, 0.20, 9.10),
    ('KNIP11', 'Kinea Índices de Preços FII', 'FII', 'Papel / IPCA', 91.80, -0.10, 10.80),
    ('KNCR11', 'Kinea Rendimentos Imobiliários FII', 'FII', 'Papel / CDI', 104.30, 0.05, 12.60),
    ('BTLG11', 'BTG Pactual Logística FII', 'FII', 'Logística / Galpões', 99.40, 0.40, 9.30),
    ('VISC11', 'Vinci Shopping Centers FII', 'FII', 'Shopping Centers', 114.80, 0.15, 8.95),
    ('HGRU11', 'CSHG Renda Urbana FII', 'FII', 'Renda Urbana / Educacional', 124.60, 0.25, 9.20),
    ('CPTS11', 'Capitânia Securities II FII', 'FII', 'Papel / CRI', 7.95, -0.25, 11.90),
    ('VGHF11', 'Valora Hedge Fund FII', 'FII', 'Hedge Fund Imobiliário', 8.45, 0.00, 12.80),
    ('TGAR11', 'TG Ativo Real FII', 'FII', 'Desenvolvimento / Loteamentos', 118.50, 0.30, 13.50),
    ('KNHY11', 'Kinea High Yield FII', 'FII', 'Papel / High Yield', 99.20, 0.10, 12.10),
    ('XPLG11', 'XP Log FII', 'FII', 'Logística / Galpões', 102.10, 0.18, 8.70),
    ('TRXF11', 'TRX Real Estate FII', 'FII', 'Renda Urbana / Imóveis Comerciais', 105.80, 0.45, 9.80),
    ('ALZR11', 'Alianza Trust Renda Imobiliária FII', 'FII', 'Híbrido / Renda Urbana', 103.50, 0.20, 8.85)
ON CONFLICT (ticker) DO UPDATE 
SET nome = EXCLUDED.nome,
    tipo = EXCLUDED.tipo,
    setor = EXCLUDED.setor,
    preco_atual = EXCLUDED.preco_atual,
    dividend_yield = EXCLUDED.dividend_yield;

-- 3. Insere com precisão as 18 operações de COMPRA da sua planilha
INSERT INTO inv.operacoes (ativo_id, tipo_operacao, data_operacao, quantidade, preco_unitario, valor_total, observacoes)
SELECT a.id, op.tipo_operacao, op.data_operacao::DATE, op.quantidade, op.preco_unitario, (op.quantidade * op.preco_unitario), 'Carga da planilha'
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

-- 4. Insere proventos recebidos correspondentes
INSERT INTO inv.proventos (ativo_id, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
SELECT a.id, prov.tipo_provento, prov.data_com::DATE, prov.data_pagamento::DATE, prov.valor_por_cota, prov.quantidade_cotas, prov.valor_total, prov.observacoes
FROM (VALUES
    ('BBAS3', 'Dividendo', '2026-10-31', '2026-11-10', 0.425000, 2200, 935.00, 'Dividendo 3T26'),
    ('TAEE4', 'JCP', '2026-11-01', '2026-11-14', 0.284000, 1400, 397.60, 'JCP Intermediário'),
    ('ITSA4', 'Dividendo', '2026-11-02', '2026-11-15', 0.152000, 1600, 243.20, 'Dividendo Mensal')
) AS prov(ticker, tipo_provento, data_com, data_pagamento, valor_por_cota, quantidade_cotas, valor_total, observacoes)
JOIN inv.ativos a ON a.ticker = prov.ticker;
