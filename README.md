# 🍕 Konys Pizza — Sistema de Reservas de Mesas

> **«La pizza más icónica de la ciudad»**  
> Cra. 36 con calle 41, Bucaramanga, Santander  
> Aplicación web integral para la digitalización y gestión de reservas de mesas y consulta de carta digital.

---

## 📌 1. Descripción del Proyecto

**Konys Pizza** es una destacada pizzería en Bucaramanga con más de 34.900 seguidores en redes sociales y atención en dos jornadas diarias:
- **Almuerzo:** 12:30 p.m. – 2:30 p.m.
- **Noche:** 5:00 p.m. – 11:00 p.m.

Históricamente, la gestión de reservas se realizaba de manera manual por WhatsApp o llamadas telefónicas, generando retrasos, desorden y riesgos de doble reserva. Esta solución web digitaliza el proceso de principio a fin:
1. **Módulo Cliente:** Permite a los clientes consultar en tiempo real las mesas activas (zonas Terraza y Salón), elegir fecha y hora en slots de 60 minutos, reservar en menos de 3 pasos sin necesidad de registro previo y consultar la Carta Digital.
2. **Módulo Administrador (`/admin`):** Panel privado con control de acceso por contraseña para gestionar el estado de las mesas (activa/inactiva, capacidad, zona), configurar horarios, administrar el catálogo de platos y supervisar/filtrar las reservas del día.

---

## 🚀 2. Arquitectura y Tecnologías

El proyecto sigue una arquitectura **JAMstack** desacoplada de alto rendimiento y bajo costo operativo:

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Presentación (Front-end)** | HTML5 Semántico + CSS3 Moderno (Grid / Flexbox) | Interfaz visual responsiva (Mobile-First) y accesible (WCAG 2.1 AA) |
| **Lógica del Cliente** | JavaScript Vanilla (ES6+) | Control del DOM, validación de formularios, cálculo de slots y prevención de condiciones de carrera |
| **Base de Datos & Backend** | [Supabase](https://supabase.com/) (PostgreSQL + API REST) / LocalStorage Fallback | Almacenamiento seguro en la nube con soporte sin conexión/modo demo automático |
| **Control de Versiones** | Git + GitHub | Trazabilidad del desarrollo mediante commits semánticos |
| **Despliegue Continuo** | [Vercel](https://vercel.com/) | Hosting global con SSL automático y CI/CD integrado |

---

## 📂 3. Estructura del Repositorio

```
P3/
├── index.html                  # Interfaz principal para el cliente y reserva
├── admin.html                  # Panel de administración privado (/admin)
├── vercel.json                 # Configuración de rutas y encabezados para Vercel
├── .gitignore                  # Exclusiones de Git
├── README.md                   # Documentación oficial del proyecto
├── css/
│   └── styles.css              # Sistema de diseño, tokens, tipografías y responsividad
├── js/
│   ├── supabase.js             # Capa de datos: Supabase Client + LocalStorage Fallback
│   ├── cliente.js              # Lógica del cliente, modal 3 pasos y comprobante
│   └── admin.js                # Lógica del panel administrativo y CRUDs
├── sql/
│   └── supabase-schema.sql     # Script SQL para crear tablas y políticas en Supabase
└── docs/
    └── mockups/                # Mockups y wireframes (Baja y Alta Fidelidad)
        ├── alta-fidelidad/     # Exportables PNG en alta resolución
        ├── baja-fidelidad/     # Wireframes en escala de grises
        ├── figma-svg/          # Archivos SVG 100% editables para importar en Figma
        └── index.html          # Mockup Studio interactivo para previsualización
```

---

## 🗄️ 4. Modelo de Datos (Colecciones / Tablas)

### 1. `mesas`
* `id` (text / uuid): Identificador único de la mesa (ej: `mesa-1`).
* `nombre` (text): Nombre visible (ej: `Mesa 1`).
* `zona` (text): Ubicación (`terraza` o `salon`).
* `capacidad` (integer): Número máximo de comensales (ej: `2`, `4`, `6`).
* `activa` (boolean): Disponibilidad para reservas (`true` / `false`).
* `foto_url` (text): URL o identificador de ilustración visual de la mesa.
* `creado_en` (timestamp): Fecha y hora de creación.

### 2. `horarios`
* `id` (text / uuid): Identificador de la franja.
* `dia_semana` (text): Día aplicable (`todos`, `lunes`, ..., `domingo`).
* `jornada` (text): `almuerzo` (12:30–14:30) o `noche` (17:00–23:00).
* `hora_inicio` (text): Hora de apertura de la franja.
* `hora_fin` (text): Hora de cierre de la franja.
* `duracion_slot` (integer): Minutos por reserva (`60`).
* `activo` (boolean): Si la franja horaria está en vigencia.

### 3. `reservas`
* `id` (text / uuid): Código alfanumérico del comprobante (ej: `KP-2026-1017`).
* `mesa_id` (text): Clave foránea a la mesa reservada.
* `cliente_nombre` (text): Nombre completo del cliente.
* `cliente_contacto` (text): Teléfono o WhatsApp de contacto.
* `num_personas` (integer): Comensales registrados (no excede capacidad).
* `fecha` (date / text): Fecha de la reserva (`YYYY-MM-DD`).
* `hora_inicio` (text): Hora inicial del slot (ej: `19:00`).
* `hora_fin` (text): Hora estimada de finalización (ej: `20:00`).
* `estado` (text): `confirmada`, `cancelada` o `completada`.
* `creado_en` (timestamp): Registro de auditoría.

### 4. `platos` (Carta Digital)
* `id` (text / uuid): Identificador del ítem.
* `nombre` (text): Nombre del plato (ej: `Pizza Santandereana`).
* `categoria` (text): `pizzas`, `entradas`, `postres` o `bebidas`.
* `descripcion` (text): Ingredientes y preparación.
* `precio` (numeric): Valor en pesos colombianos (COP).
* `disponible` (boolean): Si se muestra activo en el menú.

---

## ⚙️ 5. Configuración e Instalación Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/JanerBus/konys-reservas-app.git
   cd konys-reservas-app
   ```

2. **Ejecutar localmente:**
   No requiere Node.js ni compilación previa. Abre `index.html` directamente en tu navegador favorito, o usa un servidor estático ligero:
   ```bash
   # Con Python
   python -m http.server 3000
   
   # O con VS Code Live Server
   # Haz clic derecho en index.html -> 'Open with Live Server'
   ```

3. **Modo Demo vs. Supabase Real:**
   - La aplicación incluye un **motor híbrido automático**: si no se configuran credenciales de Supabase, funciona inmediatamente en **Modo LocalStorage / Demo**, con datos precargados, reservas interactivas y persistencia en el navegador.
   - Para conectar tu propia base de datos Supabase:
     1. Crea un proyecto en [Supabase](https://supabase.com).
     2. Ejecuta el script `sql/supabase-schema.sql` en el SQL Editor de Supabase.
     3. Abre el archivo `js/supabase.js` e ingresa tu `SUPABASE_URL` y `SUPABASE_ANON_KEY`, o cámbialos directamente desde la pestaña **Configuración** en el panel `admin.html`.

---

## 🔐 6. Acceso al Panel de Administración

- **Ruta:** `admin.html` (o haz clic en el enlace discreto "Admin" en la esquina superior derecha del encabezado).
- **Contraseña por defecto:** `admin123` *(configurable en `js/admin.js` o mediante variable)*.

---

## 🎨 7. Identidad Visual y Sistema de Diseño

- **Color Primario:** `#0F2B3D` (Navy Konys)
- **Acento:** `#F28C28` (Naranja Pizza Konys)
- **Superficie / Fondo:** `#F8FAFC`
- **Estados Semánticos:**
  - 🟢 **Libre / Confirmada:** `#22C55E` / `#DCFCE7`
  - 🔴 **Ocupada / Cancelada:** `#EF4444` / `#FEE2E2`
  - 🔵 **Completada:** `#0284C7` / `#E0F2FE`
- **Tipografía:** `Poppins` (Títulos) e `Inter` (Textos e interfaces), servidas desde Google Fonts.

---

## 👥 8. Créditos y Autoría

- **Proyecto:** P3 — Konys Pizza Sistema de Reservas de Mesas
- **Desarrollador / Integrante:** Janer Bustillo (`JanerBus`)
- **Docente / Asignatura:** Carlos Carrascal — Ingeniería de Software / Programación Web
