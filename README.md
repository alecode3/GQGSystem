# GQG System — Facturación y Cuotas

Frontend de **GQG System** para **Ingeniería de Software III** (Grupo 9). Extiende el sistema de facturación para soportar ventas y compras al **contado** y a **crédito** (regular e irregular), con generación automática de cuotas mediante **triggers PostgreSQL** en Supabase.

## Stack

- React 19 + Vite + TypeScript + TailwindCSS
- Supabase (PostgreSQL) — triggers, vistas SQL, RLS
- React Router v6

## Arquitectura

```
React (VentaForm)  →  INSERT en ventas/compras  →  Trigger PostgreSQL
                                                    ↓
React (consulta)   ←  v_cuentas_cobrar_detalle  ←  cuentas_cobrar / cuentas_pagar
```

- **Generación de cuotas:** exclusivamente en BD (triggers `tg_generar_cuentas_cobrar` / `tg_generar_cuentas_pagar`).
- **Previsualización:** el frontend replica la lógica del trigger solo para mostrar al usuario antes de confirmar (UC-01).
- **Desglose IVA:** calculado en frontend desde productos seleccionados; los totales agregados se guardan en `ventas`/`compras`.
- **Cobros/Pagos:** persisten en Supabase (`UPDATE cuentas_cobrar/pagar`) con fallback offline.

## Instalación

```bash
npm install
cp .env.example .env   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## Base de datos (Supabase SQL Editor, en orden)

1. `database_setup.sql`
2. `database_rls_policies.sql` — incluye permisos UPDATE para cobros/pagos
3. `database_seed_demo.sql`

> Si ya ejecutaste `database_rls_policies.sql` antes, volvé a ejecutarlo para aplicar las políticas UPDATE.

## Módulos

| Módulo | Ruta | Función |
|--------|------|---------|
| Dashboard | `/` | Resumen + próximos vencimientos (solo lectura) |
| Registrar Venta | `/ventas/nueva` | Productos + IVA + CO/CR + preview cuotas |
| Ver Ventas | `/ventas` | Listado + Ver Cuotas + Imprimir |
| Cuentas a Cobrar | `/cuentas-cobrar` | RF-05 resumen por cliente + cobro |
| Registrar Compra | `/compras/nueva` | Igual patrón que ventas |
| Config. Plazos | `/plazos` | ABM de planes de vencimiento |

## Casos de prueba (resumen)

Ver **`REPORTE_PRUEBAS.md`** para el reporte formal (Actividad G — TP4).

### Caso mockup del cliente (CR 30/45/60)

1. **Registrar Venta** → cliente GQG System S.A.
2. Agregar productos hasta total ≈ **Gs. 584.226** (o usar cantidades que den ese monto)
3. Fecha: `18/06/2024`
4. **Crédito** → plan **Crédito Irregular - 30/45/60 días**
5. Verificar preview: 3 cuotas de **Gs. 194.742**
6. Registrar → panel de detalle + trigger en BD

### Verificación SQL

```sql
SELECT nro_cuota, importe, vence, cobrado, estado
FROM cuentas_cobrar WHERE venta_id = 4 ORDER BY nro_cuota;
```

## Documentación de defensa

- `GUIA_DEFENSA_ORAL.md` — guion de exposición y preguntas frecuentes
- `REPORTE_PRUEBAS.md` — casos de prueba documentados

## Pre-demo

Limpiar localStorage si mezclaste modo offline con Supabase:

```javascript
['gqg_ventas_db','gqg_compras_db','gqg_cuentas_cobrar_db','gqg_cuentas_pagar_db'].forEach(k => localStorage.removeItem(k));
location.reload();
```
