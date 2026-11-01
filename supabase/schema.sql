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
