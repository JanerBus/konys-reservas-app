-- ============================================================================
-- KONYS PIZZA — SISTEMA DE RESERVAS DE MESAS (BUCARAMANGA)
-- Script de Creación de Tablas, Políticas RLS y Datos Iniciales en Supabase
-- ============================================================================

-- 1. EXTENSIÓN PARA GENERAR UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: MESAS (RF-01, RF-09, RF-10, RF-13)
CREATE TABLE IF NOT EXISTS public.mesas (
    id TEXT PRIMARY KEY DEFAULT 'mesa-' || substr(uuid_generate_v4()::text, 1, 8),
    nombre TEXT NOT NULL,
    zona TEXT NOT NULL CHECK (zona IN ('terraza', 'salon')),
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    activa BOOLEAN DEFAULT true,
    foto_url TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: HORARIOS (RF-11)
CREATE TABLE IF NOT EXISTS public.horarios (
    id TEXT PRIMARY KEY DEFAULT 'horario-' || substr(uuid_generate_v4()::text, 1, 8),
    dia_semana TEXT NOT NULL DEFAULT 'todos',
    jornada TEXT NOT NULL CHECK (jornada IN ('almuerzo', 'noche')),
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    duracion_slot INTEGER DEFAULT 60 NOT NULL,
    activo BOOLEAN DEFAULT true
);

-- 4. TABLA: RESERVAS (RF-03, RF-04, RF-05, RF-06, RF-12)
CREATE TABLE IF NOT EXISTS public.reservas (
    id TEXT PRIMARY KEY DEFAULT 'KP-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(uuid_generate_v4()::text, 1, 4)),
    mesa_id TEXT NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
    cliente_nombre TEXT NOT NULL,
    cliente_contacto TEXT,
    num_personas INTEGER NOT NULL CHECK (num_personas > 0),
    fecha DATE NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada', 'cancelada', 'completada')),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice único parcial para evitar dobles reservas en el mismo horario y fecha (Race condition guard en BD)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_sin_doble_cupo 
ON public.reservas (mesa_id, fecha, hora_inicio) 
WHERE estado = 'confirmada';

-- 5. TABLA: PLATOS / CARTA DIGITAL (RF-07, RF-14)
CREATE TABLE IF NOT EXISTS public.platos (
    id TEXT PRIMARY KEY DEFAULT 'plato-' || substr(uuid_generate_v4()::text, 1, 8),
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('pizzas', 'entradas', 'postres', 'bebidas')),
    descripcion TEXT NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    disponible BOOLEAN DEFAULT true
);

-- ============================================================================
-- 6. POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platos ENABLE ROW LEVEL SECURITY;

-- Lectura pública para la interfaz de cliente
CREATE POLICY "Lectura pública de mesas activas" ON public.mesas FOR SELECT USING (true);
CREATE POLICY "Lectura pública de horarios activos" ON public.horarios FOR SELECT USING (true);
CREATE POLICY "Lectura pública de platos disponibles" ON public.platos FOR SELECT USING (true);
CREATE POLICY "Lectura pública de reservas para cálculo de slots ocupados" ON public.reservas FOR SELECT USING (true);

-- Inserción de reservas por parte del cliente
CREATE POLICY "Clientes pueden crear reservas" ON public.reservas FOR INSERT WITH CHECK (true);

-- Acceso completo para el panel administrador (vía anon o authenticated)
CREATE POLICY "Permitir gestión total a mesas" ON public.mesas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir gestión total a horarios" ON public.horarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir gestión total a reservas" ON public.reservas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir gestión total a platos" ON public.platos FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. DATOS SEMILLA (SEED DATA)
-- ============================================================================

-- Mesas iniciales de Konys Pizza (2 Terraza, 3 Salón)
INSERT INTO public.mesas (id, nombre, zona, capacidad, activa) VALUES
('mesa-1', 'Mesa 1', 'terraza', 2, true),
('mesa-2', 'Mesa 2', 'terraza', 4, true),
('mesa-3', 'Mesa 3', 'salon', 6, true),
('mesa-4', 'Mesa 4', 'salon', 4, true),
('mesa-5', 'Mesa 5', 'salon', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Franjas de atención: Almuerzo (12:30 a 14:30) y Noche (17:00 a 23:00)
INSERT INTO public.horarios (id, dia_semana, jornada, hora_inicio, hora_fin, duracion_slot, activo) VALUES
('horario-almuerzo', 'todos', 'almuerzo', '12:30', '14:30', 60, true),
('horario-noche', 'todos', 'noche', '17:00', '23:00', 60, true)
ON CONFLICT (id) DO NOTHING;

-- Platos icónicos de la Carta Digital Konys Pizza
INSERT INTO public.platos (id, nombre, categoria, descripcion, precio, disponible) VALUES
('plato-1', 'Pizza Konys Especial', 'pizzas', 'Queso mozzarella, pepperoni artesanal, tocineta ahumada, maíz tierno y pimentón asado.', 38000, true),
('plato-2', 'Pizza Santandereana', 'pizzas', 'Carne oreada desmechada, chorizo artesanal, plátano maduro dulce y queso doble crema.', 42000, true),
('plato-3', 'Pizza Cuatro Quesos & Miel', 'pizzas', 'Mozzarella, provolone, gorgonzola, parmesano reggiano y un toque sutil de miel de abejas.', 40000, true),
('plato-4', 'Pan de Ajo Gratinado', 'entradas', 'Baguette rústica horneada a la leña con mantequilla de ajo, finas hierbas y queso parmesano.', 16500, true),
('plato-5', 'Burrata sobre Focaccia', 'entradas', 'Queso burrata fresco con tomates cherry confitados, pesto de albahaca y focaccia caliente.', 26000, true),
('plato-6', 'Volcán de Arequipe Santandereano', 'postres', 'Bizcocho tibio relleno de dulce de leche artesanal, acompañado de helado de vainilla.', 15000, true),
('plato-7', 'Cheesecake de Frutos Rojos', 'postres', 'Base crocante de galleta con crema de queso suave y reducción artesanal de moras y agraz.', 14000, true),
('plato-8', 'Limonada Cerezada Natural', 'bebidas', 'Limón Tahití recién exprimido, cerezas en almíbar y hielo frappé de 16 oz.', 11000, true),
('plato-9', 'Soda Frutos Amarillos', 'bebidas', 'Soda saborizada con maracuyá, mango, flor de jamaica y menta fresca.', 12500, true),
('plato-10', 'Cerveza Artesanal Santandereana', 'bebidas', 'Cerveza rubia de origen local con notas cítricas y maltas tostadas (330 ml).', 13500, true)
ON CONFLICT (id) DO NOTHING;
