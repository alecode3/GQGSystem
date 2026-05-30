# GQG Facturación y Cuotas (GQG System)

Este proyecto representa el frontend interactivo de **GQG System**, desarrollado para la actividad académica de **Ingeniería de Software II**. Extiende el sistema de facturación existente de la empresa ficticia para incorporar el registro y control de ventas al contado y a crédito, interactuando directamente con una base de datos **Supabase (PostgreSQL)** y consumiendo de manera automatizada la lógica implementada mediante triggers.

## 🛠️ Stack Tecnológico

El proyecto está construido siguiendo un stack moderno, fluido, tipado y optimizado para el navegador:

- **Frontend:**
  - **React 19** como librería de UI.
  - **Vite** para compilación ultrarrápida y entorno de desarrollo.
  - **TypeScript** para seguridad de tipos y contratos de interfaz.
  - **TailwindCSS v3** para una interfaz estética, premium y responsive.
  - **React Router DOM v6** para la navegación SPA de alto rendimiento.
  - **Lucide Icons** para iconografía vectorial limpia.
- **Backend (Serverless):**
  - **Supabase JS Client** como conector.
  - **Supabase Database (PostgreSQL)** para persistencia.
  - **Triggers de Base de Datos & SQL Views** para albergar la lógica del negocio.

---

## 📐 Arquitectura del Sistema y Flujo de Negocio

El sistema adopta un modelo arquitectónico de **Lógica Concentrada en Base de Datos**, minimizando el procesamiento en el cliente y garantizando consistencia a nivel de transacción:

```
┌─────────────────┐       Insert en `ventas`       ┌────────────────────────┐
│  React Frontend │ ─────────────────────────────> │  Supabase (PostgreSQL) │
│   (VentaForm)   │                                └───────────┬────────────┘
└────────┬────────┘                                            │
         ^                                         Dispara Trigger SQL
         │                                                     │
         │                                                     v
         │  Query a `v_cuentas_cobrar_detalle`     ┌────────────────────────┐
         └──────────────────────────────────────── │ Genera `cuentas_cobrar`│
                                                   └────────────────────────┘
```

1. **Inserción Unilateral:** El frontend de React realiza la inserción **únicamente** en la tabla `ventas` mediante los servicios correspondientes. Bajo ninguna circunstancia el frontend realiza cálculos matemáticos o inserciones manuales de cuotas.
2. **Generación Automatizada (Trigger):** Un trigger `after insert` en la base de datos PostgreSQL de Supabase analiza el `tipo_doc_id` y `plazo_id`. Genera de inmediato las cuotas desglosadas en la tabla `cuentas_cobrar`.
3. **Consumo Dinámico:** React realiza una consulta inmediata a la vista SQL `v_cuentas_cobrar_detalle` filtrando por el `venta_id` recién creado, desplegando los vencimientos y montos reales.

---

## 📋 Requisitos Previos

Asegúrate de contar con el siguiente entorno de ejecución:

- **Node.js** (versión 18.0 o superior recomendada).
- **npm** (versión 9.0 o superior).

---

## 🚀 Instalación y Configuración

Sigue estos sencillos pasos para levantar el entorno localmente:

### 1. Clonar o ingresar al directorio del proyecto
```bash
# Asegúrate de estar posicionado en el directorio raíz del proyecto
cd IS3-GQGSystem
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno `.env`
Renombra el archivo `.env.example` de la raíz a `.env` y edita los valores con las credenciales anónimas de tu proyecto Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```
> ⚠️ **IMPORTANTE:** Nunca utilices ni expongas la clave `service_role` en el frontend del cliente. Solo utiliza la clave pública `anon`.

### 4. Ejecutar el Servidor de Desarrollo
Inicia el entorno de desarrollo local con Vite:
```bash
npm run dev
```
La consola indicará el puerto local (usualmente `http://localhost:5173`). Abre la dirección en tu navegador para ver la interfaz.

---

## 🧪 Casos de Prueba Recomendados (Evaluación)

Para validar el correcto funcionamiento tanto de la lógica de negocio como de la interfaz, se proponen los siguientes casos prácticos de uso:

### Caso 1: Venta de Contado
- **Acción:** Dirígete a **Registrar Venta**.
- **Flujo:**
  1. Elige cualquier cliente y depósito.
  2. Selecciona **Tipo de Documento: Contado**.
  3. Notarás que el combo **Plazo Comercial** automáticamente se filtra y **solo** muestra plazos de contado (`Contado - 0 días`).
  4. Completa los datos de la factura (Serie, Nro de Factura, Timbrado) e ingresa un total base imponible (ej. `Gs. 1.000.000`).
  5. Haz clic en **Registrar Venta**.
- **Resultado Esperado:** La venta se registra y la **Sección 5 (Resultado)** despliega exactamente **1 cuota** con vencimiento igual a la fecha de la factura por el 100% del importe.

### Caso 2: Venta a Crédito Regular
- **Acción:** Dirígete a **Registrar Venta**.
- **Flujo:**
  1. Selecciona **Tipo de Documento: Crédito**.
  2. El combo de plazos filtrará dinámicamente mostrando plazos a crédito. Elige **Crédito Regular - 30/60/90 días**.
  3. Ingresa un total de factura (ej. `Gs. 3.000.000`).
  4. Completa los datos y presiona **Registrar Venta**.
- **Resultado Esperado:** En la Sección 5 se visualizarán de manera estructurada **3 cuotas** sucesivas con vencimientos a 30, 60 y 90 días, divididas equitativamente en montos de `Gs. 1.000.000` cada una.

### Caso 3: Venta a Crédito Irregular
- **Acción:** Dirígete a **Registrar Venta**.
- **Flujo:**
  1. Selecciona **Tipo de Documento: Crédito**.
  2. Selecciona el plazo **Crédito Irregular - 45/75 días**.
  3. Completa los datos e ingresa un importe total (ej. `Gs. 100` o `Gs. 1.000.000`).
  4. Presiona **Registrar Venta**.
- **Resultado Esperado:** El sistema desplegará **2 cuotas** con porcentajes desglosados (la primera por el 45% a 45 días de vencimiento, y la segunda por el 55% restante a 75 días de vencimiento).

### Caso 4: Control de Rechazos y Errores (Regla de Negocio)
El sistema valida estrictamente la coincidencia de plazos.
- **Acción:** Si intentas saltar las validaciones o si la base de datos detecta un cruce incompatible, la interfaz intercepta la excepción.
- **Resultado Esperado:** Se despliega un banner estilizado en rojo con la leyenda **"Transacción Rechazada"**, detallando el error arrojado por el trigger PostgreSQL de manera elegante al usuario, impidiendo que el formulario corrompa el sistema contable.
