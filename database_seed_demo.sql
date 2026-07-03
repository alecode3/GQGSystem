-- ============================================================================
-- DATOS DE DEMOSTRACIÓN — GQG SYSTEM
-- Ejecutar DESPUÉS de database_setup.sql en el SQL Editor de Supabase.
--
-- Qué hace:
--   1. Limpia ventas/compras/cuentas existentes (no toca catálogos)
--   2. Inserta facturas de ejemplo (contado, crédito regular, crédito irregular)
--   3. Los triggers generan automáticamente cuentas_cobrar y cuentas_pagar
--   4. Marca un cobro parcial en una cuota para probar estados
-- ============================================================================

-- Limpiar transacciones previas (las cuotas se borran en cascada)
DELETE FROM cuentas_cobrar;
DELETE FROM cuentas_pagar;
DELETE FROM ventas;
DELETE FROM compras;

-- Reiniciar secuencias de transacciones
ALTER SEQUENCE ventas_id_seq RESTART WITH 1;
ALTER SEQUENCE compras_id_seq RESTART WITH 1;
ALTER SEQUENCE cuentas_cobrar_id_seq RESTART WITH 1;
ALTER SEQUENCE cuentas_pagar_id_seq RESTART WITH 1;

-- ============================================================================
-- VENTAS DE EJEMPLO
-- tipo_doc_id: 1 = Contado (CO) | 2 = Crédito (CR)
-- plazo_id:    1 = Contado | 3 = Regular 30/60/90 | 4 = Irregular 45/75 | 5 = Irregular 30/45/60
-- ============================================================================

INSERT INTO ventas (
    fecha_proceso, fecha_factura, cliente_id, serie, nro_factura,
    timbrado, timbrado_vence, total_exento, total_impuesto, total_base, total_factura,
    deposito_id, moneda_id, tipo_doc_id, plazo_id
) VALUES
-- V1: Venta al CONTADO
(
    '2024-06-10 09:00:00-03', '2024-06-10', 2,
    '001-001', 44680, '12345678', '2025-12-31',
    0, 150000, 1500000, 1650000,
    1, 1, 1, 1
),
-- V2: Crédito REGULAR 30/60/90 (3 cuotas de 1.000.000)
(
    '2024-06-12 11:30:00-03', '2024-06-12', 3,
    '001-001', 44681, '12345678', '2025-12-31',
    0, 300000, 2700000, 3000000,
    1, 1, 2, 3
),
-- V3: Crédito IRREGULAR 45/75 días
(
    '2024-06-15 14:00:00-03', '2024-06-15', 4,
    '001-001', 44682, '12345678', '2025-12-31',
    0, 100000, 900000, 1000000,
    2, 1, 2, 4
),
-- V4: Caso del MOCKUP del cliente — CR 30/45/60 (3 cuotas de 194.742)
(
    '2024-06-18 10:00:00-03', '2024-06-18', 1,
    '001-001', 44685, '12345678', '2025-12-31',
    0, 0, 584226, 584226,
    1, 1, 2, 5
);

-- ============================================================================
-- COMPRAS DE EJEMPLO
-- ============================================================================

INSERT INTO compras (
    fecha_proceso, fecha_factura, proveedor_id, serie, nro_factura,
    timbrado, timbrado_vence, total_exento, total_impuesto, total_base, total_factura,
    deposito_id, moneda_id, tipo_doc_id, plazo_id
) VALUES
-- C1: Compra al CONTADO
(
    '2024-06-08 08:30:00-03', '2024-06-08', 1,
    '001-001', 1024, '87654321', '2025-12-31',
    0, 200000, 2000000, 2200000,
    1, 1, 1, 1
),
-- C2: Crédito REGULAR 30/60/90
(
    '2024-06-14 16:00:00-03', '2024-06-14', 2,
    '002-001', 8970, '87654321', '2025-12-31',
    0, 500000, 5000000, 5500000,
    2, 1, 2, 3
),
-- C3: Crédito IRREGULAR 30/45/60
(
    '2024-06-20 09:45:00-03', '2024-06-20', 3,
    '001-001', 5500, '87654321', '2025-12-31',
    0, 0, 750000, 750000,
    1, 1, 2, 5
);

-- ============================================================================
-- COBRO PARCIAL DE DEMOSTRACIÓN (cuota 1/3 de la venta mockup)
-- ============================================================================

UPDATE cuentas_cobrar
SET
    cobrado = 100000.00,
    saldo   = importe - 100000.00,
    estado  = 'PENDIENTE'
WHERE venta_id = 4 AND nro_cuota = 1;

-- ============================================================================
-- REAJUSTAR SECUENCIAS
-- ============================================================================

SELECT setval(pg_get_serial_sequence('ventas', 'id'),         (SELECT COALESCE(MAX(id), 1) FROM ventas));
SELECT setval(pg_get_serial_sequence('compras', 'id'),        (SELECT COALESCE(MAX(id), 1) FROM compras));
SELECT setval(pg_get_serial_sequence('cuentas_cobrar', 'id'), (SELECT COALESCE(MAX(id), 1) FROM cuentas_cobrar));
SELECT setval(pg_get_serial_sequence('cuentas_pagar', 'id'),  (SELECT COALESCE(MAX(id), 1) FROM cuentas_pagar));

-- ============================================================================
-- VERIFICACIÓN (revisar resultados al ejecutar)
-- ============================================================================

SELECT 'VENTAS' AS seccion, COUNT(*) AS total FROM ventas
UNION ALL SELECT 'COMPRAS', COUNT(*) FROM compras
UNION ALL SELECT 'CUENTAS_COBRAR', COUNT(*) FROM cuentas_cobrar
UNION ALL SELECT 'CUENTAS_PAGAR', COUNT(*) FROM cuentas_pagar;

-- Detalle venta mockup (debe mostrar 3 cuotas de 194742)
SELECT
    v.id AS venta_id,
    (v.serie || '-' || LPAD(v.nro_factura::text, 7, '0')) AS factura,
    cc.nro_cuota,
    (cc.nro_cuota || '/' || p.cuotas) AS cuota_texto,
    cc.importe,
    cc.vence,
    cc.cobrado,
    cc.saldo,
    cc.estado
FROM ventas v
JOIN cuentas_cobrar cc ON cc.venta_id = v.id
JOIN plazos p ON p.id = v.plazo_id
WHERE v.nro_factura = 44685
ORDER BY cc.nro_cuota;
