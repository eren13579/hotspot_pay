-- V9__update_payment_operator.sql
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS chk_operator;

ALTER TABLE payments
ADD CONSTRAINT chk_operator
CHECK (operator IN ('MTN_MOMO', 'ORANGE_MONEY', 'MONEROO', 'CAMPAY'));