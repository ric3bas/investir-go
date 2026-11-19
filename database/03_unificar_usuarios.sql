-- ============================================================================
-- InvestirGo - Unificação definitiva de usuários em auth.users
-- ============================================================================
-- Esta migração:
--   1. preserva user_id que já apontar para auth.users;
--   2. tenta associar registros legados pelo e-mail;
--   3. se houver uma única conta auth, associa a ela os registros restantes;
--   4. aborta sem remover nada se a associação for ambígua;
--   5. remove usuario_id e inv.usuarios somente após validar os dados.

-- Limpa uma eventual transação abortada por uma tentativa anterior.
-- Execute este arquivo isoladamente, sem outras alterações pendentes.
ROLLBACK;

BEGIN;

LOCK TABLE inv.operacoes, inv.proventos IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE inv.operacoes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE inv.proventos ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
DECLARE
    v_auth_user_id UUID;
    v_auth_users INTEGER;
    v_sem_usuario BIGINT;
    v_tem_usuarios_legados BOOLEAN;
    v_tem_operacao_legada BOOLEAN;
    v_tem_provento_legado BOOLEAN;
BEGIN
    v_tem_usuarios_legados := TO_REGCLASS('inv.usuarios') IS NOT NULL;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'inv'
           AND table_name = 'operacoes'
           AND column_name = 'usuario_id'
    ) INTO v_tem_operacao_legada;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'inv'
           AND table_name = 'proventos'
           AND column_name = 'usuario_id'
    ) INTO v_tem_provento_legado;

    -- Primeiro preserva a associação por e-mail quando ela existir.
    IF v_tem_usuarios_legados AND v_tem_operacao_legada THEN
        EXECUTE $sql$
            UPDATE inv.operacoes operacao
               SET user_id = usuario_auth.id
              FROM inv.usuarios usuario_legado
              JOIN auth.users usuario_auth
                ON usuario_auth.email_normalized = LOWER(TRIM(usuario_legado.email))
             WHERE operacao.usuario_id = usuario_legado.id
               AND NOT EXISTS (
                   SELECT 1
                     FROM auth.users usuario_valido
                    WHERE usuario_valido.id = operacao.user_id
               )
        $sql$;
    END IF;

    IF v_tem_usuarios_legados AND v_tem_provento_legado THEN
        EXECUTE $sql$
            UPDATE inv.proventos provento
               SET user_id = usuario_auth.id
              FROM inv.usuarios usuario_legado
              JOIN auth.users usuario_auth
                ON usuario_auth.email_normalized = LOWER(TRIM(usuario_legado.email))
             WHERE provento.usuario_id = usuario_legado.id
               AND NOT EXISTS (
                   SELECT 1
                     FROM auth.users usuario_valido
                    WHERE usuario_valido.id = provento.user_id
               )
        $sql$;
    END IF;

    SELECT COUNT(*) INTO v_auth_users FROM auth.users;
    SELECT COUNT(*) INTO v_sem_usuario
      FROM (
          SELECT operacao.id
            FROM inv.operacoes operacao
           WHERE operacao.user_id IS NULL
              OR NOT EXISTS (
                  SELECT 1 FROM auth.users usuario_auth
                   WHERE usuario_auth.id = operacao.user_id
              )
          UNION ALL
          SELECT provento.id
            FROM inv.proventos provento
           WHERE provento.user_id IS NULL
              OR NOT EXISTS (
                  SELECT 1 FROM auth.users usuario_auth
                   WHERE usuario_auth.id = provento.user_id
              )
      ) registros_sem_usuario;

    -- No cenário atual há uma única conta real; associa a ela o legado restante.
    IF v_sem_usuario > 0 AND v_auth_users = 1 THEN
        SELECT id INTO v_auth_user_id FROM auth.users LIMIT 1;
        UPDATE inv.operacoes operacao
           SET user_id = v_auth_user_id
         WHERE operacao.user_id IS NULL
            OR NOT EXISTS (
                SELECT 1 FROM auth.users usuario_auth
                 WHERE usuario_auth.id = operacao.user_id
            );

        UPDATE inv.proventos provento
           SET user_id = v_auth_user_id
         WHERE provento.user_id IS NULL
            OR NOT EXISTS (
                SELECT 1 FROM auth.users usuario_auth
                 WHERE usuario_auth.id = provento.user_id
            );
    ELSIF v_sem_usuario > 0 THEN
        RAISE EXCEPTION
            'Migração cancelada: existem % registros sem usuário e % contas em auth.users. Faça o mapeamento manual antes de remover inv.usuarios.',
            v_sem_usuario,
            v_auth_users;
    END IF;

    IF EXISTS (
           SELECT 1
             FROM inv.operacoes operacao
            WHERE operacao.user_id IS NULL
               OR NOT EXISTS (
                   SELECT 1 FROM auth.users usuario_auth
                    WHERE usuario_auth.id = operacao.user_id
               )
       ) OR EXISTS (
           SELECT 1
             FROM inv.proventos provento
            WHERE provento.user_id IS NULL
               OR NOT EXISTS (
                   SELECT 1 FROM auth.users usuario_auth
                    WHERE usuario_auth.id = provento.user_id
               )
       ) THEN
        RAISE EXCEPTION 'Migração cancelada: ainda existem registros sem usuário válido em auth.users.';
    END IF;
END $$;

ALTER TABLE inv.operacoes DROP COLUMN IF EXISTS usuario_id;
ALTER TABLE inv.proventos DROP COLUMN IF EXISTS usuario_id;
DROP TABLE IF EXISTS inv.usuarios;

ALTER TABLE inv.operacoes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inv.proventos ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_operacoes_user_id ON inv.operacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_proventos_user_id ON inv.proventos(user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint constraint_info
          JOIN pg_attribute column_info
            ON column_info.attrelid = constraint_info.conrelid
           AND column_info.attnum = ANY (constraint_info.conkey)
         WHERE constraint_info.contype = 'f'
           AND constraint_info.conrelid = 'inv.operacoes'::regclass
           AND constraint_info.confrelid = 'auth.users'::regclass
           AND column_info.attname = 'user_id'
    ) THEN
        ALTER TABLE inv.operacoes
            ADD CONSTRAINT fk_operacoes_auth_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint constraint_info
          JOIN pg_attribute column_info
            ON column_info.attrelid = constraint_info.conrelid
           AND column_info.attnum = ANY (constraint_info.conkey)
         WHERE constraint_info.contype = 'f'
           AND constraint_info.conrelid = 'inv.proventos'::regclass
           AND constraint_info.confrelid = 'auth.users'::regclass
           AND column_info.attname = 'user_id'
    ) THEN
        ALTER TABLE inv.proventos
            ADD CONSTRAINT fk_proventos_auth_user
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;

-- Conferência:
-- SELECT TO_REGCLASS('inv.usuarios') AS tabela_legada;
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema = 'inv'
--    AND table_name IN ('operacoes', 'proventos')
--    AND column_name = 'usuario_id';
