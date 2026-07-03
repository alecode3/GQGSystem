-- ============================================================================
-- POLÍTICAS RLS (Row Level Security) — GQG SYSTEM
-- Ejecutar en Supabase SQL Editor DESPUÉS de database_setup.sql
--
-- Sin estas políticas, la app React (rol anon) no puede leer ni insertar datos
-- y cae al modo offline (localStorage).
-- ============================================================================

-- Catálogos (solo lectura desde el frontend)
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE monedas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE depositos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_documento  ENABLE ROW LEVEL SECURITY;

-- Plazos (lectura + ABM desde Config. de Plazos)
ALTER TABLE plazos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE plazo_detalles   ENABLE ROW LEVEL SECURITY;

-- Transacciones
ALTER TABLE ventas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras          ENABLE ROW LEVEL SECURITY;

-- Cuentas generadas por triggers (lectura desde vistas)
ALTER TABLE cuentas_cobrar   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_pagar    ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Eliminar políticas previas si re-ejecutás el script
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
            'clientes','proveedores','monedas','depositos','tipos_documento',
            'plazos','plazo_detalles','ventas','compras','cuentas_cobrar','cuentas_pagar'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- CLIENTES, PROVEEDORES, MONEDAS, DEPÓSITOS, TIPOS_DOCUMENTO → SELECT
-- -----------------------------------------------------------------------------
CREATE POLICY "anon_select_clientes"
    ON clientes FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_proveedores"
    ON proveedores FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_monedas"
    ON monedas FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_depositos"
    ON depositos FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_tipos_documento"
    ON tipos_documento FOR SELECT TO anon, authenticated USING (true);

-- -----------------------------------------------------------------------------
-- PLAZOS → SELECT, INSERT, UPDATE, DELETE (ABM)
-- -----------------------------------------------------------------------------
CREATE POLICY "anon_select_plazos"
    ON plazos FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_plazos"
    ON plazos FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_update_plazos"
    ON plazos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_delete_plazos"
    ON plazos FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_plazo_detalles"
    ON plazo_detalles FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_plazo_detalles"
    ON plazo_detalles FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_delete_plazo_detalles"
    ON plazo_detalles FOR DELETE TO anon, authenticated USING (true);

-- -----------------------------------------------------------------------------
-- VENTAS / COMPRAS → SELECT + INSERT (el trigger genera las cuotas)
-- -----------------------------------------------------------------------------
CREATE POLICY "anon_select_ventas"
    ON ventas FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_ventas"
    ON ventas FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_select_compras"
    ON compras FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_compras"
    ON compras FOR INSERT TO anon, authenticated WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- CUENTAS → SELECT (necesario para las vistas v_cuentas_*_detalle)
-- -----------------------------------------------------------------------------
CREATE POLICY "anon_select_cuentas_cobrar"
    ON cuentas_cobrar FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "anon_select_cuentas_pagar"
    ON cuentas_pagar FOR SELECT TO anon, authenticated USING (true);

-- -----------------------------------------------------------------------------
-- Permisos explícitos para el rol anon (por si las tablas se crearon por SQL)
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON clientes, proveedores, monedas, depositos, tipos_documento TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON plazos TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON plazo_detalles TO anon, authenticated;
GRANT SELECT, INSERT ON ventas, compras TO anon, authenticated;
GRANT SELECT ON cuentas_cobrar, cuentas_pagar TO anon, authenticated;

-- Las vistas heredan acceso vía las tablas base; asegurar SELECT en vistas:
GRANT SELECT ON v_cuentas_cobrar_detalle, v_cuentas_pagar_detalle TO anon, authenticated;

-- Verificación
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
