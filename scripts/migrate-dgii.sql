UPDATE sales SET ncf = 'B01-' || LPAD(numero::text, 8, '0') WHERE ncf IS NULL;
UPDATE sales SET "tipoIngreso" = '01' WHERE "tipoIngreso" IS NULL;
UPDATE sales SET "itbisRetenido" = 0 WHERE "itbisRetenido" IS NULL;
UPDATE sales SET propina = 0 WHERE propina IS NULL;
