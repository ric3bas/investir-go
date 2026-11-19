-- Database Initialization for Investir-Go
CREATE SCHEMA IF NOT EXISTS inv;

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
    user_id UUID NOT NULL,
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
    user_id UUID NOT NULL,
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
