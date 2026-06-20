-- V9__fix_payment_operator_constraint.sql
-- La contrainte d'origine ne prenait pas en compte MONEROO et CAMPAY.
-- On la remplace par une version complète.

ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS chk_operator;

ALTER TABLE payments
    ADD CONSTRAINT chk_operator
        CHECK (operator IN ('MTN_MOMO', 'ORANGE_MONEY', 'MONEROO', 'CAMPAY'));

COMMENT ON COLUMN payments.operator IS 'Opérateur de paiement : MTN_MOMO, ORANGE_MONEY, MONEROO, CAMPAY';
