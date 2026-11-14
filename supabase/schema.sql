-- ==============================================================================
-- MODELO DE DATOS COLORLINK (Pintuco / Color In)
-- Compatible con PostgreSQL 14+ y Supabase Database
-- ==============================================================================

-- 1. Habilitar extensión para generación de UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLA 1: clientes
-- Almacena la información de los clientes/contratistas que radican proyectos.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(10) NOT NULL CHECK (tipo_documento IN ('CC', 'NIT', 'CE', 'Pasaporte')),
    numero_documento VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_cliente_documento UNIQUE (tipo_documento, numero_documento)
);

COMMENT ON TABLE public.clientes IS 'Registro de clientes y contratistas del ecosistema COLORLINK';
COMMENT ON COLUMN public.clientes.tipo_documento IS 'Tipo de documento: CC, NIT, CE o Pasaporte';
COMMENT ON COLUMN public.clientes.numero_documento IS 'Número de identificación fiscal o personal';

-- Índices de consulta frecuente para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON public.clientes (numero_documento);
CREATE INDEX IF NOT EXISTS idx_clientes_ciudad ON public.clientes (ciudad);

-- ==============================================================================
-- TABLA 2: productos
-- Catálogo técnico de pinturas, esmaltes y selladores (Pintuco y Color In).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    ambiente VARCHAR(100) NOT NULL,
    rendimiento_m2 NUMERIC(8, 2) NOT NULL DEFAULT 30.00 CHECK (rendimiento_m2 > 0),
    sku VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.productos IS 'Catálogo técnico de productos Pintuco y Color In';
COMMENT ON COLUMN public.productos.ambiente IS 'Ambiente recomendado: Interior, Exterior Fachada, Zonas Húmedas, etc.';
COMMENT ON COLUMN public.productos.rendimiento_m2 IS 'Rendimiento teórico en m² por galón a 2 manos';
COMMENT ON COLUMN public.productos.sku IS 'Identificador único de stock en bodega';

-- Índice de búsqueda por SKU
CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos (sku);

-- ==============================================================================
-- TABLA 3: proyectos
-- Proyectos de pintura radicados, con cálculo de materiales (BOM) y estado.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    producto_nombre VARCHAR(255),
    area_m2 NUMERIC(10, 2) NOT NULL CHECK (area_m2 > 0),
    condicion_pared VARCHAR(100) NOT NULL,
    galones_pintura INTEGER NOT NULL DEFAULT 0 CHECK (galones_pintura >= 0),
    galones_sellador INTEGER NOT NULL DEFAULT 0 CHECK (galones_sellador >= 0),
    estado_pedido VARCHAR(50) NOT NULL DEFAULT 'Cotizado' CHECK (
        estado_pedido IN (
            'Cotizado',
            'Radicado', 
            'En Alistamiento', 
            'Listo para Despacho', 
            'Despachado', 
            'Entregado', 
            'Cancelado'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla proyectos ya existía previamente, asegurar columnas y constraints actualizados
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS producto_nombre VARCHAR(255);
ALTER TABLE public.proyectos ALTER COLUMN producto_id DROP NOT NULL;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

COMMENT ON TABLE public.proyectos IS 'Solicitudes de proyectos radicados y desglose BOM';
COMMENT ON COLUMN public.proyectos.cliente_id IS 'Clave foránea hacia la tabla clientes';
COMMENT ON COLUMN public.proyectos.producto_nombre IS 'Nombre del producto / pintura seleccionada en la cotización';
COMMENT ON COLUMN public.proyectos.producto_id IS 'Clave foránea opcional hacia el producto del catálogo';
COMMENT ON COLUMN public.proyectos.galones_pintura IS 'Galones totales de pintura calculados según rendimiento y factor de absorción';
COMMENT ON COLUMN public.proyectos.galones_sellador IS 'Galones totales de sellador / imprimante requeridos';
COMMENT ON COLUMN public.proyectos.estado_pedido IS 'Estado del flujo comercial y logístico (Cotizado, Radicado, etc.)';

-- Índices de consulta para trazabilidad rápida
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON public.proyectos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_producto ON public.proyectos (producto_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.proyectos (estado_pedido);
CREATE INDEX IF NOT EXISTS idx_proyectos_created_at ON public.proyectos (created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE ACCESO SUPABASE
-- Permite lectura y creación pública mediante API Key anónima (anon / public).
-- ==============================================================================

-- 1. Habilitar RLS en cada tabla
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Políticas para 'clientes'
-- ------------------------------------------------------------------------------
-- Permitir consulta pública de clientes (para búsqueda de órdenes por documento)
CREATE POLICY "Permitir lectura publica de clientes"
    ON public.clientes
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Permitir radicación / inserción pública de nuevos clientes desde el formulario FMV
CREATE POLICY "Permitir insercion publica de clientes"
    ON public.clientes
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Permitir actualización de datos por rol autenticado/admin
CREATE POLICY "Permitir actualizacion de clientes a usuarios autenticados"
    ON public.clientes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Políticas para 'productos'
-- ------------------------------------------------------------------------------
-- Lectura pública del catálogo para todos los clientes y visitantes
CREATE POLICY "Permitir lectura publica de productos"
    ON public.productos
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Inserción / modificación de catálogo reservada para administradores autenticados
CREATE POLICY "Permitir gestion de productos solo a autenticados"
    ON public.productos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- Políticas para 'proyectos'
-- ------------------------------------------------------------------------------
-- Lectura pública de proyectos (permite al cliente rastrear su pedido con su código/documento)
CREATE POLICY "Permitir lectura publica de proyectos"
    ON public.proyectos
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Inserción pública de proyectos desde el cotizador FMV
CREATE POLICY "Permitir insercion publica de proyectos"
    ON public.proyectos
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Actualización de estado del pedido (para bodega y administradores)
CREATE POLICY "Permitir actualizacion de proyectos"
    ON public.proyectos
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- DATOS INICIALES (SEED DATA)
-- Poblar el catálogo con los productos clave de Pintuco y Color In
-- ==============================================================================
INSERT INTO public.productos (nombre, ambiente, rendimiento_m2, sku)
VALUES
    ('Koraza Doble Vida Protección Clima Extremo', 'Exterior Fachada', 30.00, 'PIN-KRZ-DV-GL'),
    ('Viniltex Avanzado Máxima Lavabilidad', 'Interior', 30.00, 'PIN-VTX-01-GL'),
    ('Viniltex Baños y Cocinas Antibacterial', 'Zonas Húmedas / Baños y Cocinas', 30.00, 'PIN-VTX-BC-GL'),
    ('Koraza 10 Años Alta Resistencia a Salinidad', 'Marítimo / Costero', 30.00, 'PIN-KRZ-10-GL'),
    ('Viniltex Ultra Lavable Acrílica Premium', 'Alto Tráfico / Institucional', 30.00, 'PIN-VTX-ULT-GL'),
    ('Intervinil Cielos Mate Antirreflejo', 'Cielorrasos / Techos', 32.00, 'CIN-INT-CL-GL'),
    ('Esmalte Sintético Pintulux Máxima Durabilidad', 'Industrial / Metales', 28.00, 'PIN-PLX-MAX-GL'),
    ('Sellador Acrílico Pintuco 100% Interiores/Exteriores', 'Multiuso / Pared Nueva', 40.00, 'PIN-IMP-ACR-GL'),
    ('Pintuco Fill Imprimante / Sellador Exterior', 'Exterior / Fachadas Porosas', 40.00, 'PIN-FIL-IMP-GL'),
    ('Sellador Antihumedad Aquablock / Barrera Hidrófuga', 'Zonas Afectadas por Humedad', 40.00, 'PIN-AQB-SEL-GL')
ON CONFLICT (sku) DO NOTHING;

-- ==============================================================================
-- EXTENSIÓN MULTIDISPOSITIVO & REALTIME (PEDIDOS, DIRECCIONES, TICKETS SAC, CHAT)
-- ==============================================================================

-- Ampliar tabla 'clientes' con campos de sincronización por usuario/correo
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS direccion TEXT;
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes (email);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes (user_id);

-- Ampliar tabla 'proyectos' con guía y observaciones de bodega
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS order_number VARCHAR(80);
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS guia_transporte VARCHAR(100);
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS observaciones_bodega TEXT;

-- ==============================================================================
-- TABLA 4: orders (Pedidos E-commerce y Checkout unificados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(80) UNIQUE NOT NULL,
    user_id UUID,
    user_email VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(60),
    customer_document VARCHAR(60),
    shipping_address TEXT,
    city VARCHAR(120),
    department VARCHAR(120),
    delivery_mode VARCHAR(50) DEFAULT 'delivery',
    items JSONB DEFAULT '[]'::jsonb,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status VARCHAR(80) NOT NULL DEFAULT 'pending',
    guia_transporte VARCHAR(100),
    observaciones_bodega TEXT,
    form_data JSONB,
    calculo_data JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders (user_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_doc ON public.orders (customer_document);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_select_all') THEN
    CREATE POLICY "orders_select_all" ON public.orders FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_insert_all') THEN
    CREATE POLICY "orders_insert_all" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_update_all') THEN
    CREATE POLICY "orders_update_all" ON public.orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- TABLA 5: user_addresses (Libreta de Direcciones del Cliente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id TEXT PRIMARY KEY,
    user_id UUID,
    user_email VARCHAR(255) NOT NULL,
    etiqueta VARCHAR(120) NOT NULL,
    direccion TEXT NOT NULL,
    departamento VARCHAR(120) DEFAULT 'Cundinamarca',
    ciudad VARCHAR(120) DEFAULT 'Bogotá D.C.',
    detalles TEXT DEFAULT '',
    es_predeterminada BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_email ON public.user_addresses (user_email);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses (user_id);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_addresses' AND policyname = 'user_addresses_all') THEN
    CREATE POLICY "user_addresses_all" ON public.user_addresses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- TABLA 6: tickets (PQRS y Servicio al Cliente SAC en tiempo real)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY,
    radicado VARCHAR(80) UNIQUE NOT NULL,
    user_id UUID,
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(60) DEFAULT '',
    canal VARCHAR(80) DEFAULT 'Formulario PQR',
    categoria VARCHAR(120) DEFAULT 'Asesoría Técnica Pinturas',
    asunto VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(60) DEFAULT 'Nuevo',
    prioridad VARCHAR(40) DEFAULT 'Media',
    mensajes JSONB DEFAULT '[]'::jsonb,
    sla_horas_limite INTEGER DEFAULT 8,
    sla_vencido BOOLEAN DEFAULT false,
    fecha_creacion VARCHAR(60),
    fecha_ultima_actividad VARCHAR(60),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_email ON public.tickets (cliente_email);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets (created_at DESC);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tickets' AND policyname = 'tickets_all') THEN
    CREATE POLICY "tickets_all" ON public.tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- TABLA 7: chat_messages (Historial Multidispositivo de Chat con Linky IA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    user_id UUID,
    user_email VARCHAR(255) NOT NULL,
    message_id VARCHAR(120) NOT NULL,
    sender VARCHAR(40) NOT NULL,
    text TEXT NOT NULL,
    image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_email ON public.chat_messages (user_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages (created_at ASC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'chat_messages_all') THEN
    CREATE POLICY "chat_messages_all" ON public.chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- HABILITAR SUPABASE REALTIME EN TABLAS CRÍTICAS
-- ==============================================================================
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.proyectos REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.user_addresses REPLICA IDENTITY FULL;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['orders', 'proyectos', 'tickets', 'chat_messages', 'user_addresses']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION WHEN duplicate_object THEN
      -- Ya incluida en supabase_realtime
      NULL;
    WHEN undefined_object THEN
      NULL;
    END;
  END LOOP;
END $$;

