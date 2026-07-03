# Reporte de Pruebas — Actividad G (TP4)
## GQG System — Grupo 9 — Ingeniería de Software III

**Responsable:** Luis Godoy (QA)  
**Fecha:** Julio 2026  
**Entorno:** React + Supabase PostgreSQL / modo offline de respaldo

---

## 1. Objetivo

Validar que el sistema cumple los requisitos funcionales RF-01 a RF-05 y los casos de uso UC-01, verificando la integración entre la interfaz React y los triggers PostgreSQL.

---

## 2. Estrategia de prueba

| Tipo | Alcance | Herramienta |
|------|---------|-------------|
| Prueba unitaria de cálculo | Prorrateo de cuotas, residuo en última cuota | `cuotasPreview.ts` + query SQL |
| Prueba de integración | INSERT venta → trigger → vista detalle | Supabase SQL Editor + UI |
| Prueba de aceptación | Flujos CO / CR Regular / CR Irregular | UI manual + seed demo |
| Prueba de regresión | Cobro parcial, rechazo de plazo incompatible | UI + SQL |

---

## 3. Casos de prueba

### CP-01: Venta al Contado (CO)

| Campo | Valor |
|-------|-------|
| **Precondición** | Cliente activo, plazo Contado (id=1) en BD |
| **Pasos** | Registrar Venta → agregar 1 producto → Contado (CO) → Registrar |
| **Resultado esperado** | 1 cuota al 100%, vence en fecha de factura |
| **Estado** | ✅ Aprobado |

**Verificación SQL:**
```sql
SELECT nro_cuota, importe, vence, estado FROM cuentas_cobrar
WHERE venta_id = (SELECT MAX(id) FROM ventas) ORDER BY nro_cuota;
```

---

### CP-02: Crédito Regular 30/60/90

| Campo | Valor |
|-------|-------|
| **Precondición** | Plazo id=3 (3 cuotas regulares) |
| **Pasos** | Registrar Venta → total Gs. 3.000.000 → Crédito → plan 30/60/90 → preview → Registrar |
| **Resultado esperado** | 3 cuotas de Gs. 1.000.000; vencimientos +30, +60, +90 días |
| **Estado** | ✅ Aprobado |

---

### CP-03: Crédito Irregular 30/45/60 (mockup cliente)

| Campo | Valor |
|-------|-------|
| **Precondición** | Plazo id=5 con `plazo_detalles` (30, 45, 60) |
| **Pasos** | Registrar Venta → productos → total Gs. 584.226 → fecha 18/06/2024 → CR 30/45/60 |
| **Resultado esperado** | 3 cuotas de Gs. 194.742; suma = total factura |
| **Estado** | ✅ Aprobado (seed demo venta_id=4) |

**Query de referencia:**
```sql
SELECT nro_cuota, importe, vence, cobrado FROM cuentas_cobrar
WHERE venta_id = 4 ORDER BY nro_cuota;
-- Esperado: 194742 | 194742 | 194742 (cuota 1 con cobro parcial 100000 en seed)
```

---

### CP-04: Plazo incompatible (rechazo trigger)

| Campo | Valor |
|-------|-------|
| **Pasos** | Intentar Contado (CO) con plazo de crédito, o viceversa |
| **Resultado esperado** | Banner de error; transacción rechazada; sin filas en cuentas_cobrar |
| **Estado** | ✅ Aprobado |

---

### CP-05: Previsualización antes de guardar (UC-01)

| Campo | Valor |
|-------|-------|
| **Pasos** | Seleccionar CO/CR + plan + total → observar tabla preview |
| **Resultado esperado** | Cuota \| Importe \| Vence \| Cobrado visible antes de Registrar |
| **Estado** | ✅ Aprobado |

---

### CP-06: Detalle cuenta corriente (mockup UI)

| Campo | Valor |
|-------|-------|
| **Pasos** | Ver Ventas → factura 001-001-0044685 → Ver Cuotas |
| **Resultado esperado** | Encabezado: Cliente, Factura, Fecha, Moneda, Cuotas + tabla |
| **Estado** | ✅ Aprobado |

---

### CP-07: RF-05 — Estado por cliente

| Campo | Valor |
|-------|-------|
| **Pasos** | Ir a Cuentas a Cobrar → ver panel "Estado de Cuenta por Cliente" |
| **Resultado esperado** | Saldo pendiente consolidado por cliente; clic filtra cuotas |
| **Estado** | ✅ Aprobado |

---

### CP-08: Cobro parcial en Supabase

| Campo | Valor |
|-------|-------|
| **Precondición** | `database_rls_policies.sql` con UPDATE en cuentas_cobrar |
| **Pasos** | Cuentas a Cobrar → Cobrar monto parcial en cuota pendiente → Refrescar |
| **Resultado esperado** | `cobrado` y `saldo` actualizados en BD; estado PENDIENTE o COBRADO |
| **Estado** | ✅ Aprobado (con Supabase conectado) |

---

### CP-09: Compra a crédito (espejo ventas)

| Campo | Valor |
|-------|-------|
| **Pasos** | Registrar Compra → productos → Crédito Regular → Registrar |
| **Resultado esperado** | Cuotas en `cuentas_pagar` vía trigger |
| **Estado** | ✅ Aprobado |

---

### CP-10: ABM Plazos

| Campo | Valor |
|-------|-------|
| **Pasos** | Config. de Plazos → crear plazo irregular con días → usar en nueva venta |
| **Resultado esperado** | Plazo disponible en selector; cuotas según días configurados |
| **Estado** | ✅ Aprobado |

---

## 4. Prueba de saldo cero (RF-03)

**Objetivo:** Verificar que la suma de cuotas = `total_factura`.

```sql
SELECT v.id, v.total_factura, SUM(cc.importe) AS suma_cuotas,
       v.total_factura - SUM(cc.importe) AS diferencia
FROM ventas v
JOIN cuentas_cobrar cc ON cc.venta_id = v.id
GROUP BY v.id, v.total_factura
HAVING ABS(v.total_factura - SUM(cc.importe)) > 0.01;
-- Resultado esperado: 0 filas (sin diferencias)
```

**Estado:** ✅ Aprobado en seed demo

---

## 5. Observaciones conocidas

| Tema | Nota |
|------|------|
| TRUNCATE vs ROUND | TP2 documenta TRUNCATE; implementación usa ROUND. Para guaraníes enteros el resultado es equivalente. |
| Productos | Catálogo en frontend; no persiste líneas en BD (fuera de alcance TP). |
| Modo offline | Fallback localStorage si Supabase no responde; no usar en demo final. |

---

## 6. Conclusión

El sistema **aprueba los casos críticos** del requerimiento del cliente y del camino crítico TP4. Listo para defensa con Supabase configurado y seed demo cargado.

**Firma QA:** Luis Godoy — Grupo 9
