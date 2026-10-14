-- =========================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL PARA OBENTO
-- Compartida entre Web Pública, Monitor Takeaway y Dashboard
-- =========================================================

-- Tabla principal de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  numero_pedido VARCHAR(20) UNIQUE NOT NULL,
  cliente_nombre VARCHAR(150) NOT NULL,
  cliente_telefono VARCHAR(50) NOT NULL,
  cliente_email VARCHAR(150),
  tipo_entrega VARCHAR(50) DEFAULT 'recogida_local', -- 'recogida_local' o 'domicilio'
  direccion_entrega TEXT,
  direccion_detalles VARCHAR(255),
  codigo_postal VARCHAR(10),
  repartidor_id VARCHAR(50),
  repartidor_nombre VARCHAR(100),
  fecha_salida_reparto TIMESTAMP WITH TIME ZONE,
  fecha_entregado TIMESTAMP WITH TIME ZONE,
  tiempo_entrega_minutos INTEGER,
  hora_recogida VARCHAR(50),
  notas TEXT,
  metodo_pago VARCHAR(50) NOT NULL, -- 'stripe' o 'restaurante'
  estado_pago VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'fallido'
  estado_pedido VARCHAR(50) NOT NULL DEFAULT 'recibido', -- 'recibido', 'en_preparacion', 'listo', 'listo_reparto', 'en_camino', 'entregado', 'cancelado'
  total NUMERIC(10, 2) NOT NULL,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de los ítems o platos del pedido
CREATE TABLE IF NOT EXISTS pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  dish_id VARCHAR(50) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(50),
  porcion VARCHAR(50),
  opcion VARCHAR(100),
  precio_unitario NUMERIC(10, 2) NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10, 2) NOT NULL,
  notas TEXT
);

-- Índices para optimizar consultas rápidas en el Monitor Takeaway y Dashboard
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_pago ON pedidos(estado_pago);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id ON pedido_items(pedido_id);
