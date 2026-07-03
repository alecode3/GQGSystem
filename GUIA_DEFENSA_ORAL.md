# Guía de Defensa Oral — GQG System
## Parametrización de Vencimientos de Cuotas Regulares e Irregulares

**Duración sugerida:** 4–5 minutos de exposición + preguntas del evaluador.

---

## 1. Apertura (30 segundos)

> "Buenos días/tardes. Somos el Grupo 9 de Ingeniería de Software III. Presentamos **GQG System**, el módulo de parametrización de vencimientos de cuotas para extender el sistema de facturación que antes solo operaba al contado.
>
> El problema era que la empresa no podía registrar ventas ni compras a crédito con planes de cuotas personalizados. Nuestra solución permite elegir **Contado o Crédito**, configurar plazos regulares e irregulares, y generar automáticamente las cuotas en la base de datos mediante **triggers de PostgreSQL**."

---

## 2. Demostración en vivo (3 minutos) — seguir este orden

### Paso 1: Dashboard (20 s)
- Abrir `http://localhost:5173`
- Mostrar que el header dice **"Supabase Conectado"** (si no, explicar modo simulado)
- Señalar las 4 tarjetas: ventas, compras, cuentas a cobrar, cuentas a pagar
- Mencionar: *"Los datos vienen del seed `database_seed_demo.sql`"*

### Paso 2: Registrar Venta a Crédito Irregular (60 s)
1. Ir a **Registrar Venta**
2. Seleccionar cliente **GQG System S.A.**
3. Fecha: `18/06/2024`
4. Agregar productos hasta total **Gs. 584.226** (el desglose IVA se calcula solo)
5. En **Condición de Pago** → **Crédito (CR)** → **Crédito Irregular - 30/45/60 días**
6. **Mostrar la previsualización** (3 cuotas de Gs. 194.742)
7. Clic en **Registrar Venta**
8. Mostrar panel de detalle generado

**Frase clave:**
> "El frontend solo inserta en la tabla `ventas`. El trigger `tg_generar_cuentas_cobrar` genera las 3 cuotas en `cuentas_cobrar` sin intervención manual."

### Paso 3: Ver Cuotas de una factura existente (30 s)
1. Ir a **Ver Ventas**
2. Buscar factura `001-001-0044685`
3. Clic en **Ver Cuotas**
4. Mostrar encabezado: Cliente, Factura, Fecha, Moneda, **Cuotas**

### Paso 4: Trigger en Supabase (40 s)
Abrir SQL Editor y ejecutar:

```sql
SELECT nro_cuota, importe, vence, cobrado, estado
FROM cuentas_cobrar
WHERE venta_id = 4
ORDER BY nro_cuota;
```

**Resultado esperado:** 3 cuotas de 194.742; cuota 1 con cobro parcial de 100.000.

### Paso 5: Impresión de factura (30 s)
- Desde **Ver Ventas** → botón **Imprimir** en la factura mockup
- Señalar el campo **Cuotas: CR-30-45-60 días** en el documento

---

## 3. Cierre de la exposición (30 segundos)

> "En resumen: implementamos la arquitectura cliente-servidor con React y Supabase, la lógica de negocio en triggers PostgreSQL, previsualización de cuotas antes de confirmar, y el detalle de cuenta corriente que pedía el requerimiento. El proyecto sigue el camino crítico del TP4: análisis, diseño de BD, triggers, interfaz y pruebas. Quedamos atentos a sus consultas."

---

## 4. Preguntas frecuentes del evaluador — respuestas preparadas

### "¿Cuál era el problema de negocio?"
**R:** GQG System solo facturaba al contado. Con el crecimiento de clientes necesitaban vender y comprar a crédito con planes de cuotas regulares (30/60/90) e irregulares (días personalizados por cuota), generando automáticamente el detalle de deuda.

---

### "¿Cuál es la diferencia entre Contado, Crédito Regular e Irregular?"

| Modalidad | Comportamiento |
|-----------|----------------|
| **Contado (CO)** | 1 cuota, vence en la fecha de la factura |
| **Crédito Regular** | N cuotas, vencimiento cada 30 días (mensual) |
| **Crédito Irregular** | N cuotas, días definidos en `plazo_detalles` (ej. 30, 45, 60) |

**R corta:** "Contado es una sola cuota al día. Regular reparte en intervalos de 30 días. Irregular usa días específicos por cuota guardados en `plazo_detalles`."

---

### "¿Dónde está la lógica de negocio: frontend o base de datos?"
**R:** En la **base de datos**. El trigger `fn_generar_cuentas_cobrar()` se ejecuta `AFTER INSERT` en `ventas`. El frontend solo:
1. Valida el formulario
2. Inserta en `ventas`
3. Consulta `v_cuentas_cobrar_detalle` para mostrar el resultado

La previsualización en React usa `cuotasPreview.ts`, que replica la misma lógica del trigger para que el usuario valide antes de guardar (RF-02 / UC-01).

---

### "¿Qué hace el trigger exactamente?"
**R:** 
1. Lee el `plazo_id` y `tipo_doc_id` de la venta insertada
2. Valida que el plazo sea compatible con el tipo (CO con plazo contado, CR con plazo crédito)
3. Si es **contado**: 1 cuota al 100%, vence hoy
4. Si es **crédito regular**: divide el total en N cuotas, vencimientos a 30/60/90...
5. Si es **crédito irregular**: lee los días de `plazo_detalles` y genera una fila por cuota
6. La **última cuota absorbe el residuo** del redondeo para que la suma coincida con `total_factura`

---

### "¿Por qué usan ROUND y no TRUNCATE como dice el TP2?"
**R:** "El TP2 documenta TRUNCATE para guaraníes enteros. En la implementación usamos `ROUND(..., 2)` en PostgreSQL, que para montos sin decimales produce el mismo resultado. La regla clave — residuo en la última cuota — está implementada en ambos casos."

---

### "¿Qué es el ABM de Plazos y por qué existe si el requerimiento es facturar?"
**R:** "Son dos capas distintas:
- **Configuración de Plazos** = el administrador define los planes disponibles (ej. CR-30-45-60)
- **Registrar Venta** = el vendedor elige Contado/Crédito y el plan al facturar

El ABM parametriza; la facturación consume esos parámetros. Es coherente con la guía del examen y con la tabla `plazos` + `plazo_detalles` del diseño."

---

### "¿Qué tablas intervienen y cómo se relacionan?"
**R:**
```
tipos_documento (CO/CR)
       ↓
    plazos ←→ plazo_detalles (días por cuota, solo irregular)
       ↓
    ventas / compras
       ↓ (trigger)
cuentas_cobrar / cuentas_pagar
       ↓ (vista)
v_cuentas_cobrar_detalle / v_cuentas_pagar_detalle
```

---

### "¿Cómo justifican cada campo de cuentas_cobrar?"

| Campo | Justificación |
|-------|---------------|
| `venta_id` | FK a la factura que originó la deuda |
| `nro_cuota` | Número correlativo (1, 2, 3...) |
| `importe` | Monto de esa cuota (prorrateo del total) |
| `vence` | Fecha calculada según plazo regular o irregular |
| `cobrado` | Lo ya pagado por el cliente (0 al crear) |
| `saldo` | `importe - cobrado` |
| `estado` | PENDIENTE / COBRADO |

---

### "¿El sistema también cubre compras?"
**R:** "Sí. Registrar Compra usa el mismo patrón: productos, IVA automático, CO/CR, preview y trigger `fn_generar_cuentas_pagar()`."

---

### "¿Cómo funciona el cobro de cuotas?"
**R:** "En Cuentas a Cobrar el operador registra el monto. Se persiste con `UPDATE` en `cuentas_cobrar` en Supabase (cobrado, saldo, estado). Si no hay conexión, hay fallback offline."

---

### "¿Qué es RF-05 en la interfaz?"
**R:** "En Cuentas a Cobrar hay un panel que consolida el saldo pendiente por cliente usando la vista `v_cuentas_cobrar_detalle`. Al hacer clic filtra las cuotas de ese cliente."

---

### "¿Qué pasa si elijo un plazo incompatible?"
**R:** "El trigger lanza una excepción: *'El plazo seleccionado no es compatible con el tipo de documento'*. El frontend la captura y muestra el banner rojo 'Transacción Rechazada'. No se corrompe la base de datos."

---

### "¿Cómo probaron el sistema? (Actividad G del TP4)"
**R:** "Con el reporte formal `REPORTE_PRUEBAS.md`: 10 casos documentados (CO, CR regular, CR irregular mockup, rechazo, preview UC-01, detalle UI, RF-05 por cliente, cobro en Supabase, compras, ABM plazos). Además `database_seed_demo.sql` carga datos de ejemplo."

---

### "¿Qué NO está en el alcance del proyecto?"
**R:** "Según el TP1, no incluimos:
- Módulo de cobranza física completa
- Cálculo de intereses por mora
- Autenticación de usuarios (hay badge de sesión simulada)

El cobro parcial persiste en Supabase cuando hay conexión; la generación de cuotas es el entregable central."

---

### "¿Cómo se relaciona el TP4 PERT con lo implementado?"

| Actividad | Responsable | Entregable real |
|-----------|-------------|-----------------|
| A – Requisitos | Natalia | TP2 en el documento |
| B – Diseño BD | Silvia | `database_setup.sql` |
| D – Triggers | Silvia | `fn_generar_cuentas_cobrar/pagar` |
| E – Frontend | Alejandro | React + preview + detalle |
| G – Pruebas | Luis | README casos + seed |
| H – Documentación | Carlos | README + esta guía + scripts SQL |

**Camino crítico A→B→D→E→G→H: completado.**

---

## 5. Reparto sugerido entre integrantes (defensa en equipo)

| Integrante | Rol TP | Qué presenta (≈1 min c/u) |
|------------|--------|---------------------------|
| **Natalia** | Analista | Problema, RF-01 a RF-05, UC-01, modalidades CO/CR |
| **Silvia** | Backend | Diagrama de tablas, trigger en pantalla, demo SQL |
| **Alejandro** | Frontend | Demo Registrar Venta + previsualización + panel detalle |
| **Luis** | Tester | Casos de prueba, seed demo, validación del mockup |
| **Carlos** | Jefe de proyecto | TP4 PERT/CPM, cierre, coordinación del equipo |

---

## 6. Checklist pre-defensa (hacer 1 hora antes)

- [ ] `.env` configurado con credenciales Supabase
- [ ] `npm run dev` corriendo sin errores
- [ ] Header muestra **"Supabase Conectado"**
- [ ] Ejecutados: `database_setup.sql`, `database_rls_policies.sql` (con UPDATE), `database_seed_demo.sql`
- [ ] Limpiar `localStorage` del navegador (F12 → consola):
  ```javascript
  ['gqg_ventas_db','gqg_compras_db','gqg_cuentas_cobrar_db','gqg_cuentas_pagar_db'].forEach(k => localStorage.removeItem(k));
  location.reload();
  ```
- [ ] Tener abierto Supabase SQL Editor con la query del Paso 4
- [ ] Probar impresión de factura (permitir pop-ups)
- [ ] Ensayar una vez el flujo completo en voz alta

---

## 7. Si algo falla durante la demo

| Problema | Plan B |
|----------|--------|
| Supabase no conecta | "El sistema tiene modo simulado offline; la lógica del trigger está en `database_setup.sql`" → mostrar SQL |
| No hay datos | Ejecutar `database_seed_demo.sql` en vivo |
| Error RLS | Ejecutar `database_rls_policies.sql` |
| Pop-up bloqueado | Mostrar `invoicePrinter.ts` en código |
| Pregunta difícil sobre TRUNCATE | "La última cuota absorbe el residuo; verifiquemos con la query SQL" |

---

## 8. Frase de cierre para el evaluador

> "El sistema GQG System cumple el requerimiento del cliente: permite facturar al contado y a crédito con vencimientos regulares e irregulares, genera las cuotas automáticamente mediante triggers, muestra el detalle de cuenta corriente, y está alineado con la planificación PERT–CPM del TP4. Gracias por su atención."
