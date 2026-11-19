-- ============================================================================
-- InvestirGo - Importação idempotente das operações da planilha (2026)
-- ============================================================================
-- Antes de executar, substitua o e-mail abaixo pelo e-mail usado para entrar
-- no portal. A conta precisa existir em auth.users.

BEGIN;

CREATE TEMP TABLE importar_operacoes_2026 (
    data_operacao DATE NOT NULL,
    ticker VARCHAR(12) NOT NULL,
    quantidade NUMERIC(15, 4) NOT NULL,
    preco_unitario NUMERIC(15, 4) NOT NULL,
    tipo_operacao VARCHAR(10) NOT NULL
) ON COMMIT DROP;

INSERT INTO importar_operacoes_2026
    (data_operacao, ticker, quantidade, preco_unitario, tipo_operacao)
VALUES
    (DATE '2026-10-26', 'BBAS3',  1500, 17.94, 'COMPRA'),
    (DATE '2026-10-26', 'TAEE4',  1000, 14.08, 'COMPRA'),
    (DATE '2026-10-26', 'ITSA4',  1000, 13.19, 'COMPRA'),
    (DATE '2026-10-26', 'BBDC4',   700, 15.55, 'COMPRA'),
    (DATE '2026-10-28', 'BBAS3',   400, 16.96, 'COMPRA'),
    (DATE '2026-10-28', 'TAEE4',   400, 13.30, 'COMPRA'),
    (DATE '2026-10-28', 'ITSA4',   400, 12.91, 'COMPRA'),
    (DATE '2026-10-28', 'SANB4',   400, 12.52, 'COMPRA'),
    (DATE '2026-10-28', 'POMO4',  1300,  3.82, 'COMPRA'),
    (DATE '2026-10-28', 'BBDC3',   400, 13.62, 'COMPRA'),
    (DATE '2026-10-30', 'BBDC4',   100, 14.04, 'COMPRA'),
    (DATE '2026-10-30', 'SANB4',   200, 12.07, 'COMPRA'),
    (DATE '2026-10-30', 'ITSA4',   200, 12.50, 'COMPRA'),
    (DATE '2026-11-03', 'BBDC4',   300, 13.54, 'COMPRA'),
    (DATE '2026-11-03', 'BBAS3',   300, 16.12, 'COMPRA'),
    (DATE '2026-11-12', 'BBAS3',  1000, 15.54, 'COMPRA'),
    (DATE '2026-11-13', 'BBAS3',   800, 15.14, 'COMPRA'),
    (DATE '2026-11-17', 'BBAS3',   700, 14.82, 'COMPRA');

DO $$
DECLARE
    -- ALTERE SOMENTE ESTE E-MAIL.
    v_email CONSTANT TEXT := LOWER('usuario@investirgo.com');
    v_user_id UUID;
    v_tickers_ausentes TEXT;
    v_inseridas INTEGER;
BEGIN
    SELECT id
      INTO v_user_id
      FROM auth.users
     WHERE email_normalized = v_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION
            'A conta % não existe em auth.users. Cadastre-se no portal antes de importar.',
            v_email;
    END IF;

    SELECT STRING_AGG(DISTINCT origem.ticker, ', ' ORDER BY origem.ticker)
      INTO v_tickers_ausentes
      FROM importar_operacoes_2026 origem
      LEFT JOIN inv.ativos ativo
        ON UPPER(ativo.ticker) = UPPER(origem.ticker)
     WHERE ativo.id IS NULL;

    IF v_tickers_ausentes IS NOT NULL THEN
        RAISE EXCEPTION
            'Cadastre os seguintes ativos antes da importação: %',
            v_tickers_ausentes;
    END IF;

    INSERT INTO inv.operacoes (
        ativo_id,
        user_id,
        tipo_operacao,
        data_operacao,
        quantidade,
        preco_unitario,
        valor_total,
        taxas,
        observacoes
    )
    SELECT
        ativo.id,
        v_user_id,
        origem.tipo_operacao,
        origem.data_operacao,
        origem.quantidade,
        origem.preco_unitario,
        origem.quantidade * origem.preco_unitario,
        0,
        'Importação da planilha de operações 2026'
    FROM importar_operacoes_2026 origem
    JOIN inv.ativos ativo
      ON UPPER(ativo.ticker) = UPPER(origem.ticker)
    WHERE NOT EXISTS (
        SELECT 1
          FROM inv.operacoes existente
         WHERE existente.user_id = v_user_id
           AND existente.ativo_id = ativo.id
           AND existente.tipo_operacao = origem.tipo_operacao
           AND existente.data_operacao = origem.data_operacao
           AND existente.quantidade = origem.quantidade
           AND existente.preco_unitario = origem.preco_unitario
    );

    GET DIAGNOSTICS v_inseridas = ROW_COUNT;
    RAISE NOTICE '% operação(ões) inserida(s).', v_inseridas;
END $$;

COMMIT;

-- Conferência após a importação:
-- SELECT o.data_operacao, a.ticker, o.quantidade, o.preco_unitario,
--        o.valor_total, o.tipo_operacao
--   FROM inv.operacoes o
--   JOIN inv.ativos a ON a.id = o.ativo_id
--   JOIN auth.users u ON u.id = o.user_id
--  WHERE u.email_normalized = LOWER('usuario@investirgo.com')
--  ORDER BY o.data_operacao, o.id;
