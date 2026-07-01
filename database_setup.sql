-- ============================================================================
-- SCRIPT DE CONFIGURACIÓN Y INICIALIZACIÓN DE LA BASE DE DATOS (SUPABASE)
-- PROYECTO: GQG SYSTEM (ACTIVIDAD ACADÉMICA - INGENIERÍA DE SOFTWARE III)
-- ============================================================================

-- 1. LIMPIEZA DE TABLAS Y VISTAS PREVIAS (Para ejecuciones repetidas)
DROP VIEW IF EXISTS v_cuentas_pagar_detalle CASCADE;
DROP VIEW IF EXISTS v_cuentas_cobrar_detalle CASCADE;
DROP TABLE IF EXISTS cuentas_pagar CASCADE;
DROP TABLE IF EXISTS cuentas_cobrar CASCADE;
DROP TABLE IF EXISTS compras CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS plazo_detalles CASCADE;
DROP TABLE IF EXISTS plazos CASCADE;
DROP TABLE IF EXISTS tipos_documento CASCADE;
DROP TABLE IF EXISTS depositos CASCADE;
DROP TABLE IF EXISTS monedas CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP FUNCTION IF EXISTS fn_generar_cuentas_cobrar() CASCADE;
DROP FUNCTION IF EXISTS fn_generar_cuentas_pagar() CASCADE;

-- 2. CREACIÓN DE TABLAS BASE

-- Tabla: Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    ruc VARCHAR(20) NOT NULL UNIQUE,
    direccion VARCHAR(250),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    ruc VARCHAR(20) NOT NULL UNIQUE,
    direccion VARCHAR(250),
    telefono VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Monedas
CREATE TABLE IF NOT EXISTS monedas (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL UNIQUE,
    simbolo VARCHAR(5) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Depósitos
CREATE TABLE IF NOT EXISTS depositos (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Tipos de Documento
CREATE TABLE IF NOT EXISTS tipos_documento (
    id SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) NOT NULL,
    codigo VARCHAR(5) NOT NULL UNIQUE, -- 'CO' = Contado, 'CR' = Crédito
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Plazos
CREATE TABLE IF NOT EXISTS plazos (
    id SERIAL PRIMARY KEY,
    plazo VARCHAR(100) NOT NULL,
    tipo_id INTEGER REFERENCES tipos_documento(id),
    cuotas INTEGER NOT NULL DEFAULT 1,
    irregular BOOLEAN DEFAULT FALSE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- Tabla: Plazo Detalles (para vencimientos irregulares)
CREATE TABLE IF NOT EXISTS plazo_detalles (
    id SERIAL PRIMARY KEY,
    plazo_id INTEGER REFERENCES plazos(id) ON DELETE CASCADE,
    cuota INTEGER NOT NULL,
    dias INTEGER NOT NULL,
    UNIQUE(plazo_id, cuota)
);

-- Tabla: Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    fecha_proceso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_factura DATE NOT NULL,
    cliente_id INTEGER REFERENCES clientes(id) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    nro_factura INTEGER NOT NULL,
    timbrado VARCHAR(20) NOT NULL,
    timbrado_vence DATE NOT NULL,
    total_exento NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    total_impuesto NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    total_base NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    total_factura NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    deposito_id INTEGER REFERENCES depositos(id) NOT NULL,
    moneda_id INTEGER REFERENCES monedas(id) NOT NULL,
    tipo_doc_id INTEGER REFERENCES tipos_documento(id) NOT NULL,
    plazo_id INTEGER REFERENCES plazos(id) NOT NULL
);

-- Tabla: Cuentas a Cobrar (Ventas)
CREATE TABLE IF NOT EXISTS cuentas_cobrar (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE NOT NULL,
    nro_cuota INTEGER NOT NULL,
    importe NUMERIC(15,2) NOT NULL,
    vence DATE NOT NULL,
    cobrado NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    saldo NUMERIC(15,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' NOT NULL,
    CONSTRAINT chk_estado_cc CHECK (estado IN ('PENDIENTE', 'COBRADO')),
    UNIQUE(venta_id, nro_cuota)
);

-- Tabla: Compras
CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    fecha_proceso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_factura DATE NOT NULL,
    proveedor_id INTEGER REFERENCES proveedores(id) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    nro_factura INTEGER NOT NULL,
    timbrado VARCHAR(20) NOT NULL,
    timbrado_vence DATE NOT NULL,
    total_exento NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    total_impuesto NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    total_base NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    total_factura NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    deposito_id INTEGER REFERENCES depositos(id) NOT NULL,
    moneda_id INTEGER REFERENCES monedas(id) NOT NULL,
    tipo_doc_id INTEGER REFERENCES tipos_documento(id) NOT NULL,
    plazo_id INTEGER REFERENCES plazos(id) NOT NULL
);

-- Tabla: Cuentas a Pagar (Compras)
CREATE TABLE IF NOT EXISTS cuentas_pagar (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE NOT NULL,
    nro_cuota INTEGER NOT NULL,
    importe NUMERIC(15,2) NOT NULL,
    vence DATE NOT NULL,
    pagado NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    saldo NUMERIC(15,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' NOT NULL,
    CONSTRAINT chk_estado_cp CHECK (estado IN ('PENDIENTE', 'PAGADO')),
    UNIQUE(compra_id, nro_cuota)
);


-- 3. VISTAS DETALLADAS PARA EL FRONTEND (Reportes y Tablas)

-- Vista: v_cuentas_cobrar_detalle
CREATE OR REPLACE VIEW v_cuentas_cobrar_detalle AS
SELECT 
    cc.id AS cuenta_id,
    cc.venta_id,
    v.fecha_proceso,
    v.fecha_factura,
    (v.serie || '-' || LPAD(v.nro_factura::text, 7, '0')) AS factura,
    v.timbrado,
    v.total_factura,
    v.cliente_id,
    v.cliente_id::text AS cliente,
    m.descripcion AS moneda,
    m.abreviatura AS moneda_abreviatura,
    p.plazo,
    p.cuotas AS total_cuotas,
    cc.nro_cuota AS cuota,
    (cc.nro_cuota || '/' || p.cuotas) AS cuota_texto,
    cc.importe,
    cc.vence,
    cc.cobrado,
    cc.saldo,
    cc.estado
FROM cuentas_cobrar cc
JOIN ventas v ON cc.venta_id = v.id
JOIN clientes cl ON v.cliente_id = cl.id
JOIN monedas m ON v.moneda_id = m.id
JOIN plazos p ON v.plazo_id = p.id;

-- Vista: v_cuentas_pagar_detalle
CREATE OR REPLACE VIEW v_cuentas_pagar_detalle AS
SELECT 
    cp.id AS cuenta_id,
    cp.compra_id,
    c.fecha_proceso,
    c.fecha_factura,
    (c.serie || '-' || LPAD(c.nro_factura::text, 7, '0')) AS factura,
    c.timbrado,
    c.total_factura,
    c.proveedor_id,
    c.proveedor_id::text AS proveedor,
    m.descripcion AS moneda,
    m.abreviatura AS moneda_abreviatura,
    p.plazo,
    p.cuotas AS total_cuotas,
    cp.nro_cuota AS cuota,
    (cp.nro_cuota || '/' || p.cuotas) AS cuota_texto,
    cp.importe,
    cp.vence,
    cp.pagado,
    cp.saldo,
    cp.estado
FROM cuentas_pagar cp
JOIN compras c ON cp.compra_id = c.id
JOIN proveedores pr ON c.proveedor_id = pr.id
JOIN monedas m ON c.moneda_id = m.id
JOIN plazos p ON c.plazo_id = p.id;


-- 4. DISPARADORES Y LÓGICA DE NEGOCIO (TRIGGERS)

-- Trigger 1: Ventas -> Cuentas a Cobrar
CREATE OR REPLACE FUNCTION fn_generar_cuentas_cobrar()
RETURNS TRIGGER AS $$
DECLARE
    v_plazo_tipo_id INTEGER;
    v_plazo_cuotas INTEGER;
    v_plazo_irregular BOOLEAN;
    v_importe_cuota NUMERIC(15,2);
    v_importe_final NUMERIC(15,2);
    v_acumulado NUMERIC(15,2) := 0.00;
    r_detalle RECORD;
    v_idx INTEGER := 1;
BEGIN
    -- Validar compatibilidad de plazo
    SELECT tipo_id, cuotas, irregular INTO v_plazo_tipo_id, v_plazo_cuotas, v_plazo_irregular 
    FROM plazos WHERE id = NEW.plazo_id;

    IF v_plazo_tipo_id <> NEW.tipo_doc_id THEN
        RAISE EXCEPTION 'Error de negocio: El plazo seleccionado no es compatible con el tipo de documento.';
    END IF;

    -- Generar cuotas
    IF NEW.tipo_doc_id = 1 THEN
        -- CONTADO (CO): 1 única cuota en la misma fecha de factura
        INSERT INTO cuentas_cobrar (venta_id, nro_cuota, importe, vence, cobrado, saldo, estado)
        VALUES (NEW.id, 1, NEW.total_factura, NEW.fecha_factura, 0.00, NEW.total_factura, 'PENDIENTE');
    ELSE
        -- CRÉDITO (CR)
        IF v_plazo_irregular = FALSE THEN
            -- Vencimiento Regular: Mensual a partir de la fecha de la factura (30, 60, 90...)
            v_importe_cuota := ROUND(NEW.total_factura / v_plazo_cuotas, 2);
            
            FOR i IN 1..(v_plazo_cuotas - 1) LOOP
                v_importe_final := v_importe_cuota;
                v_acumulado := v_acumulado + v_importe_final;
                INSERT INTO cuentas_cobrar (venta_id, nro_cuota, importe, vence, cobrado, saldo, estado)
                VALUES (NEW.id, i, v_importe_final, NEW.fecha_factura + (i * 30 * INTERVAL '1 day'), 0.00, v_importe_final, 'PENDIENTE');
            END LOOP;
            
            -- Última cuota absorbe diferencias de redondeo
            v_importe_final := NEW.total_factura - v_acumulado;
            INSERT INTO cuentas_cobrar (venta_id, nro_cuota, importe, vence, cobrado, saldo, estado)
            VALUES (NEW.id, v_plazo_cuotas, v_importe_final, NEW.fecha_factura + (v_plazo_cuotas * 30 * INTERVAL '1 day'), 0.00, v_importe_final, 'PENDIENTE');
        
        ELSE
            -- Vencimiento Irregular: Días personalizados desde plazo_detalles
            v_importe_cuota := ROUND(NEW.total_factura / v_plazo_cuotas, 2);
            
            FOR r_detalle IN SELECT cuota, dias FROM plazo_detalles WHERE plazo_id = NEW.plazo_id ORDER BY cuota LOOP
                IF v_idx < v_plazo_cuotas THEN
                    v_importe_final := v_importe_cuota;
                ELSE
                    v_importe_final := NEW.total_factura - v_acumulado;
                END IF;
                v_acumulado := v_acumulado + v_importe_final;
                
                INSERT INTO cuentas_cobrar (venta_id, nro_cuota, importe, vence, cobrado, saldo, estado)
                VALUES (NEW.id, r_detalle.cuota, v_importe_final, NEW.fecha_factura + (r_detalle.dias * INTERVAL '1 day'), 0.00, v_importe_final, 'PENDIENTE');
                
                v_idx := v_idx + 1;
            END LOOP;
            
            -- Salvaguarda en caso de que no haya detalles guardados (por si acaso)
            IF v_idx = 1 THEN
                INSERT INTO cuentas_cobrar (venta_id, nro_cuota, importe, vence, cobrado, saldo, estado)
                VALUES (NEW.id, 1, NEW.total_factura, NEW.fecha_factura + (30 * INTERVAL '1 day'), 0.00, NEW.total_factura, 'PENDIENTE');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_generar_cuentas_cobrar
AFTER INSERT ON ventas
FOR EACH ROW
EXECUTE FUNCTION fn_generar_cuentas_cobrar();


-- Trigger 2: Compras -> Cuentas a Pagar
CREATE OR REPLACE FUNCTION fn_generar_cuentas_pagar()
RETURNS TRIGGER AS $$
DECLARE
    v_plazo_tipo_id INTEGER;
    v_plazo_cuotas INTEGER;
    v_plazo_irregular BOOLEAN;
    v_importe_cuota NUMERIC(15,2);
    v_importe_final NUMERIC(15,2);
    v_acumulado NUMERIC(15,2) := 0.00;
    r_detalle RECORD;
    v_idx INTEGER := 1;
BEGIN
    -- Validar compatibilidad de plazo
    SELECT tipo_id, cuotas, irregular INTO v_plazo_tipo_id, v_plazo_cuotas, v_plazo_irregular 
    FROM plazos WHERE id = NEW.plazo_id;

    IF v_plazo_tipo_id <> NEW.tipo_doc_id THEN
        RAISE EXCEPTION 'Error de negocio: El plazo seleccionado no es compatible con el tipo de documento.';
    END IF;

    -- Generar cuotas
    IF NEW.tipo_doc_id = 1 THEN
        -- CONTADO (CO): 1 única cuota en la misma fecha de factura
        INSERT INTO cuentas_pagar (compra_id, nro_cuota, importe, vence, pagado, saldo, estado)
        VALUES (NEW.id, 1, NEW.total_factura, NEW.fecha_factura, 0.00, NEW.total_factura, 'PENDIENTE');
    ELSE
        -- CRÉDITO (CR)
        IF v_plazo_irregular = FALSE THEN
            -- Vencimiento Regular: Mensual a partir de la fecha de la factura (30, 60, 90...)
            v_importe_cuota := ROUND(NEW.total_factura / v_plazo_cuotas, 2);
            
            FOR i IN 1..(v_plazo_cuotas - 1) LOOP
                v_importe_final := v_importe_cuota;
                v_acumulado := v_acumulado + v_importe_final;
                INSERT INTO cuentas_pagar (compra_id, nro_cuota, importe, vence, pagado, saldo, estado)
                VALUES (NEW.id, i, v_importe_final, NEW.fecha_factura + (i * 30 * INTERVAL '1 day'), 0.00, v_importe_final, 'PENDIENTE');
            END LOOP;
            
            -- Última cuota absorbe diferencias de redondeo
            v_importe_final := NEW.total_factura - v_acumulado;
            INSERT INTO cuentas_pagar (compra_id, nro_cuota, importe, vence, pagado, saldo, estado)
            VALUES (NEW.id, v_plazo_cuotas, v_importe_final, NEW.fecha_factura + (v_plazo_cuotas * 30 * INTERVAL '1 day'), 0.00, v_importe_final, 'PENDIENTE');
        
        ELSE
            -- Vencimiento Irregular: Días personalizados desde plazo_detalles
            v_importe_cuota := ROUND(NEW.total_factura / v_plazo_cuotas, 2);
            
            FOR r_detalle IN SELECT cuota, dias FROM plazo_detalles WHERE plazo_id = NEW.plazo_id ORDER BY cuota LOOP
                IF v_idx < v_plazo_cuotas THEN
                    v_importe_final := v_importe_cuota;
                ELSE
                    v_importe_final := NEW.total_factura - v_acumulado;
                END IF;
                v_acumulado := v_acumulado + v_importe_final;
                
                INSERT INTO cuentas_pagar (compra_id, nro_cuota, importe, vence, pagado, saldo, estado)
                VALUES (NEW.id, r_detalle.cuota, v_importe_final, NEW.fecha_factura + (r_detalle.dias * INTERVAL '1 day'), 0.00, v_importe_final, 'PENDIENTE');
                
                v_idx := v_idx + 1;
            END LOOP;
            
            -- Salvaguarda en caso de que no haya detalles guardados (por si acaso)
            IF v_idx = 1 THEN
                INSERT INTO cuentas_pagar (compra_id, nro_cuota, importe, vence, pagado, saldo, estado)
                VALUES (NEW.id, 1, NEW.total_factura, NEW.fecha_factura + (30 * INTERVAL '1 day'), 0.00, NEW.total_factura, 'PENDIENTE');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_generar_cuentas_pagar
AFTER INSERT ON compras
FOR EACH ROW
EXECUTE FUNCTION fn_generar_cuentas_pagar();


-- 5. SEMILLAS DE DATOS DE CATÁLOGO (SEED DATA)

-- Insertar Monedas
INSERT INTO monedas (id, descripcion, abreviatura, simbolo, activo) VALUES
(1, 'Guaraníes', 'PYG', 'Gs.', true),
(2, 'Dólares Americanos', 'USD', 'US$', true)
ON CONFLICT (id) DO UPDATE SET 
    descripcion = EXCLUDED.descripcion, 
    abreviatura = EXCLUDED.abreviatura, 
    simbolo = EXCLUDED.simbolo;

-- Insertar Depósitos
INSERT INTO depositos (id, descripcion, activo) VALUES
(1, 'Depósito Central (Asunción)', true),
(2, 'Depósito Ciudad del Este', true),
(3, 'Depósito Encarnación', true)
ON CONFLICT (id) DO UPDATE SET 
    descripcion = EXCLUDED.descripcion;

-- Insertar Clientes
INSERT INTO clientes (id, ruc, direccion, telefono, activo) VALUES
(1, '80012345-6', 'Av. España 1450, Asunción', '021-600700', true),
(2, '80054321-0', 'Ruta 7 Km 4, Ciudad del Este', '061-500600', true),
(3, '80098765-4', 'Mariscal Estigarribia 450, Encarnación', '071-400300', true),
(4, '3456789-2', 'Gral. Aquino 980, Luque', '021-645312', true),
(5, '80112233-9', 'Mcal. López e Insaurralde, Fdo de la Mora', '021-505808', true)
ON CONFLICT (id) DO UPDATE SET 
    ruc = EXCLUDED.ruc,
    direccion = EXCLUDED.direccion,
    telefono = EXCLUDED.telefono;

-- Insertar Proveedores
INSERT INTO proveedores (id, ruc, direccion, telefono, activo) VALUES
(1, '90012345-0', 'Av. Artigas 1200, Asunción', '021-200300', true),
(2, '90054321-1', 'Av. Monseñor Rodríguez, CDE', '061-600100', true),
(3, '90098765-2', 'Ruta 1 Km 2, Encarnación', '071-300400', true)
ON CONFLICT (id) DO UPDATE SET 
    ruc = EXCLUDED.ruc,
    direccion = EXCLUDED.direccion,
    telefono = EXCLUDED.telefono;

-- Insertar Tipos de Documento
INSERT INTO tipos_documento (id, descripcion, codigo, activo) VALUES
(1, 'Contado', 'CO', true),
(2, 'Crédito', 'CR', true)
ON CONFLICT (id) DO UPDATE SET 
    descripcion = EXCLUDED.descripcion, 
    codigo = EXCLUDED.codigo;

-- Insertar Plazos
INSERT INTO plazos (id, plazo, tipo_id, cuotas, irregular, activo) VALUES
(1, 'Contado - 0 días', 1, 1, false, true),
(2, 'Crédito - 30 días', 2, 1, false, true),
(3, 'Crédito Regular - 30/60/90 días', 2, 3, false, true),
(4, 'Crédito Irregular - 45/75 días', 2, 2, true, true)
ON CONFLICT (id) DO UPDATE SET 
    plazo = EXCLUDED.plazo,
    tipo_id = EXCLUDED.tipo_id,
    cuotas = EXCLUDED.cuotas,
    irregular = EXCLUDED.irregular;

-- Insertar Plazo Detalles (para plazos irregulares)
INSERT INTO plazo_detalles (id, plazo_id, cuota, dias) VALUES
(1, 4, 1, 45),
(2, 4, 2, 75)
ON CONFLICT (id) DO UPDATE SET 
    plazo_id = EXCLUDED.plazo_id,
    cuota = EXCLUDED.cuota,
    dias = EXCLUDED.dias;

-- Reajustar secuencias para evitar errores en posteriores inserciones del frontend
SELECT setval(pg_get_serial_sequence('clientes', 'id'), COALESCE(MAX(id), 1)) FROM clientes;
SELECT setval(pg_get_serial_sequence('proveedores', 'id'), COALESCE(MAX(id), 1)) FROM proveedores;
SELECT setval(pg_get_serial_sequence('monedas', 'id'), COALESCE(MAX(id), 1)) FROM monedas;
SELECT setval(pg_get_serial_sequence('depositos', 'id'), COALESCE(MAX(id), 1)) FROM depositos;
SELECT setval(pg_get_serial_sequence('tipos_documento', 'id'), COALESCE(MAX(id), 1)) FROM tipos_documento;
SELECT setval(pg_get_serial_sequence('plazos', 'id'), COALESCE(MAX(id), 1)) FROM plazos;
SELECT setval(pg_get_serial_sequence('plazo_detalles', 'id'), COALESCE(MAX(id), 1)) FROM plazo_detalles;
SELECT setval(pg_get_serial_sequence('ventas', 'id'), COALESCE(MAX(id), 1)) FROM ventas;
SELECT setval(pg_get_serial_sequence('compras', 'id'), COALESCE(MAX(id), 1)) FROM compras;
SELECT setval(pg_get_serial_sequence('cuentas_cobrar', 'id'), COALESCE(MAX(id), 1)) FROM cuentas_cobrar;
SELECT setval(pg_get_serial_sequence('cuentas_pagar', 'id'), COALESCE(MAX(id), 1)) FROM cuentas_pagar;
