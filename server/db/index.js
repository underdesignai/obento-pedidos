import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de conexión PostgreSQL
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'obento_db',
      port: Number(process.env.PGPORT) || 5432,
    };

export const pool = new Pool(poolConfig);

let isDbInitialized = false;

// Inicializa las tablas automáticamente al conectarse
export async function initDatabase() {
  try {
    const client = await pool.connect();
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      isDbInitialized = true;
      console.log('✅ [PostgreSQL] Tablas inicializadas y listas para Obento.');

      // Reparación automática de acentos dañados con '?' en MenuItem (heredados de codificación previa)
      try {
        await client.query(`
          UPDATE "MenuItem" SET nombre = REPLACE(nombre, 'salm?n', 'salmón'), descripcion = REPLACE(descripcion, 'salm?n', 'salmón') WHERE nombre LIKE '%salm?n%' OR descripcion LIKE '%salm?n%';
          UPDATE "MenuItem" SET nombre = REPLACE(nombre, 'at?n', 'atún'), descripcion = REPLACE(descripcion, 'at?n', 'atún') WHERE nombre LIKE '%at?n%' OR descripcion LIKE '%at?n%';
          UPDATE "MenuItem" SET nombre = REPLACE(nombre, 'lim?n', 'limón'), descripcion = REPLACE(descripcion, 'lim?n', 'limón') WHERE nombre LIKE '%lim?n%' OR descripcion LIKE '%lim?n%';
          UPDATE "MenuItem" SET nombre = REPLACE(nombre, 'J?netsu', 'Jōnetsu'), descripcion = REPLACE(descripcion, 'J?netsu', 'Jōnetsu') WHERE nombre LIKE '%J?netsu%' OR descripcion LIKE '%J?netsu%';
          UPDATE "MenuItem" SET descripcion = REPLACE(descripcion, 'az?car', 'azúcar') WHERE descripcion LIKE '%az?car%';
          UPDATE "MenuItem" SET descripcion = REPLACE(descripcion, 'esp?rrago', 'espárrago') WHERE descripcion LIKE '%esp?rrago%';
          UPDATE "MenuItem" SET descripcion = REPLACE(descripcion, 's?samo', 'sésamo') WHERE descripcion LIKE '%s?samo%';
          UPDATE "MenuItem" SET descripcion = REPLACE(descripcion, 'holand?s', 'holandés') WHERE descripcion LIKE '%holand?s%';
          UPDATE "MenuItem" SET descripcion = REPLACE(descripcion, 'acompa?ado', 'acompañado') WHERE descripcion LIKE '%acompa?ado%';
        `);
      } catch (_) {}
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('⚠️ [PostgreSQL] No se pudo conectar de inmediato a PostgreSQL:', err.message);
    console.warn('👉 Asegúrate de configurar DATABASE_URL o PGHOST/PGUSER en el archivo .env.');
  }
}

// Función auxiliar para reparar acentos dañados en cualquier texto
export function fixCorruptedAccents(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/salm\?n/gi, 'salmón')
    .replace(/at\?n/gi, 'atún')
    .replace(/lim\?n/gi, 'limón')
    .replace(/J\?netsu/g, 'Jōnetsu')
    .replace(/az\?car/gi, 'azúcar')
    .replace(/esp\?rrago/gi, 'espárrago')
    .replace(/s\?samo/gi, 'sésamo')
    .replace(/holand\?s/gi, 'holandés')
    .replace(/acompa\?ado/gi, 'acompañado')
    .replace(/C\?digo/gi, 'Código')
    .replace(/cup\?n/gi, 'cupón')
    .replace(/direcci\?n/gi, 'dirección')
    .replace(/tel\?fono/gi, 'teléfono');
}

// Genera un número legible de pedido: ej. OB-8472
export function generarNumeroPedido() {
  const prefijo = 'OB';
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `${prefijo}-${aleatorio}`;
}

// Crea un pedido completo con sus ítems dentro de una transacción segura
export async function crearPedidoEnDb({
  cliente_nombre,
  cliente_telefono,
  cliente_email,
  tipo_entrega = 'recogida_local',
  direccion_entrega = null,
  direccion_detalles = null,
  codigo_postal = null,
  hora_recogida,
  notas,
  metodo_pago,
  estado_pago = 'pendiente',
  estado_pedido = 'recibido',
  total,
  stripe_session_id = null,
  items = []
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Comprobar y asegurar columnas si la tabla ya existía
    try {
      await client.query(`
        ALTER TABLE pedidos 
        ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
        ADD COLUMN IF NOT EXISTS direccion_detalles VARCHAR(255),
        ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10),
        ADD COLUMN IF NOT EXISTS repartidor_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS repartidor_nombre VARCHAR(100),
        ADD COLUMN IF NOT EXISTS fecha_salida_reparto TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS fecha_entregado TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS tiempo_entrega_minutos INTEGER;
      `);
    } catch (_) {}

    const numero_pedido = generarNumeroPedido();

    const insertPedidoQuery = `
      INSERT INTO pedidos (
        numero_pedido, cliente_nombre, cliente_telefono, cliente_email,
        tipo_entrega, direccion_entrega, direccion_detalles, codigo_postal,
        hora_recogida, notas, metodo_pago, estado_pago,
        estado_pedido, total, stripe_session_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const pedidoValues = [
      numero_pedido,
      cliente_nombre,
      cliente_telefono,
      cliente_email || null,
      tipo_entrega,
      direccion_entrega || null,
      direccion_detalles || null,
      codigo_postal || null,
      hora_recogida || 'Lo antes posible',
      notas || null,
      metodo_pago,
      estado_pago,
      estado_pedido,
      Number(total).toFixed(2),
      stripe_session_id
    ];

    const pedidoRes = await client.query(insertPedidoQuery, pedidoValues);
    const pedidoCreado = pedidoRes.rows[0];

    // Insertar cada plato / ítem
    const insertItemQuery = `
      INSERT INTO pedido_items (
        pedido_id, dish_id, nombre, categoria, porcion, opcion,
        precio_unitario, cantidad, subtotal, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const itemsGuardados = [];
    for (const it of items) {
      const itemValues = [
        pedidoCreado.id,
        it.id || it.dish_id,
        it.nombre,
        it.cat || it.categoria || null,
        it.porcion || null,
        it.opcion || null,
        Number(it.precio_unitario || it.precio || 0).toFixed(2),
        Number(it.cantidad || 1),
        Number(it.subtotal || ((it.precio || 0) * (it.cantidad || 1))).toFixed(2),
        it.notas || null
      ];
      const itemRes = await client.query(insertItemQuery, itemValues);
      itemsGuardados.push(itemRes.rows[0]);
    }

    await client.query('COMMIT');

    return {
      ...pedidoCreado,
      items: itemsGuardados
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Obtener pedidos con sus ítems (para monitor Takeaway y Dashboard)
export async function obtenerPedidosDb({ estado, soloPagados = false, limit = 100 } = {}) {
  let sql = `
    SELECT 
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'dish_id', pi.dish_id,
            'nombre', pi.nombre,
            'categoria', pi.categoria,
            'porcion', pi.porcion,
            'opcion', pi.opcion,
            'precio_unitario', pi.precio_unitario,
            'cantidad', pi.cantidad,
            'subtotal', pi.subtotal,
            'notas', pi.notas
          )
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS items
    FROM pedidos p
    LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
    WHERE 1=1
  `;
  const values = [];

  if (estado) {
    values.push(estado);
    sql += ` AND p.estado_pedido = $${values.length}`;
  }

  if (soloPagados) {
    sql += ` AND p.estado_pago = 'pagado'`;
  }

  sql += `
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ${Number(limit)}
  `;

  const res = await pool.query(sql, values);
  return res.rows;
}

// Actualizar estado del pedido (ej: monitor Takeaway marca 'en_preparacion', 'listo', 'entregado')
export async function actualizarEstadoPedidoDb(id, nuevoEstado, extraData = {}) {
  let extraSets = '';
  const values = [nuevoEstado, id];

  if (nuevoEstado === 'en_camino') {
    extraSets += `, fecha_salida_reparto = COALESCE(fecha_salida_reparto, CURRENT_TIMESTAMP)`;
    if (extraData.repartidor_nombre) {
      values.push(extraData.repartidor_nombre);
      extraSets += `, repartidor_nombre = $${values.length}`;
    }
  } else if (nuevoEstado === 'entregado') {
    extraSets += `, fecha_entregado = CURRENT_TIMESTAMP`;
    extraSets += `, tiempo_entrega_minutos = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(fecha_salida_reparto, created_at))) / 60)`;
  }

  const sql = `
    UPDATE pedidos
    SET estado_pedido = $1, updated_at = CURRENT_TIMESTAMP ${extraSets}
    WHERE id = $2 OR numero_pedido = $2::text
    RETURNING *;
  `;
  const res = await pool.query(sql, values);
  return res.rows[0];
}

// Historial y métricas de delivery agrupadas por día y por hora
export async function obtenerHistorialDeliveryDb() {
  try {
    const listadoSql = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'nombre', pi.nombre,
              'cantidad', pi.cantidad,
              'precio_unitario', pi.precio_unitario,
              'subtotal', pi.subtotal
            )
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM pedidos p
      LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
      WHERE p.tipo_entrega IN ('domicilio', 'delivery')
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 200;
    `;
    const resList = await pool.query(listadoSql);

    // Métricas por hora del día
    const metricasHoraSql = `
      SELECT 
        EXTRACT(HOUR FROM created_at) AS hora,
        COUNT(*) AS total_pedidos,
        ROUND(AVG(COALESCE(tiempo_entrega_minutos, 25)), 1) AS promedio_minutos,
        SUM(total) AS total_facturado
      FROM pedidos
      WHERE tipo_entrega IN ('domicilio', 'delivery') AND estado_pedido = 'entregado'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hora ASC;
    `;
    const resHoras = await pool.query(metricasHoraSql);

    // Métricas por día
    const metricasDiaSql = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS fecha,
        COUNT(*) AS total_pedidos,
        COUNT(CASE WHEN estado_pedido = 'entregado' THEN 1 END) AS entregados,
        ROUND(AVG(COALESCE(tiempo_entrega_minutos, 25)), 1) AS promedio_minutos,
        SUM(total) AS total_facturado
      FROM pedidos
      WHERE tipo_entrega IN ('domicilio', 'delivery')
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY fecha DESC
      LIMIT 14;
    `;
    const resDias = await pool.query(metricasDiaSql);

    return {
      pedidos: resList.rows,
      porHora: resHoras.rows,
      porDia: resDias.rows
    };
  } catch (err) {
    console.error('Error al obtener historial delivery de PostgreSQL:', err);
    throw err;
  }
}

// Actualizar estado de pago (ej: cuando Stripe confirma el cobro)
export async function actualizarEstadoPagoDb(idOrSessionId, nuevoEstadoPago, stripePaymentIntentId = null) {
  const isNumeric = /^\d+$/.test(String(idOrSessionId || ''));
  const sql = isNumeric
    ? `
      UPDATE pedidos
      SET estado_pago = $1::varchar,
          estado_pedido = CASE WHEN $1::varchar = 'pagado' AND (estado_pedido IS NULL OR estado_pedido = 'recibido' OR estado_pedido = 'pendiente') THEN 'preparando' ELSE estado_pedido END,
          stripe_payment_intent_id = COALESCE($2::varchar, stripe_payment_intent_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3::integer OR numero_pedido = $3::varchar
      RETURNING *;
    `
    : `
      UPDATE pedidos
      SET estado_pago = $1::varchar,
          estado_pedido = CASE WHEN $1::varchar = 'pagado' AND (estado_pedido IS NULL OR estado_pedido = 'recibido' OR estado_pedido = 'pendiente') THEN 'preparando' ELSE estado_pedido END,
          stripe_payment_intent_id = COALESCE($2::varchar, stripe_payment_intent_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE stripe_session_id = $3::varchar OR numero_pedido = $3::varchar
      RETURNING *;
    `;
  const res = await pool.query(sql, [nuevoEstadoPago, stripePaymentIntentId, String(idOrSessionId)]);
  return res.rows[0];
}

// Obtener un pedido específico por ID o Número de pedido
export async function obtenerPedidoPorIdDb(idOrNumero) {
  const isNumeric = /^\d+$/.test(String(idOrNumero || ''));
  const sql = `
    SELECT 
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pi.id,
            'dish_id', pi.dish_id,
            'nombre', pi.nombre,
            'categoria', pi.categoria,
            'porcion', pi.porcion,
            'opcion', pi.opcion,
            'precio_unitario', pi.precio_unitario,
            'cantidad', pi.cantidad,
            'subtotal', pi.subtotal,
            'notas', pi.notas
          )
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'
      ) AS items
    FROM pedidos p
    LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
    WHERE ${isNumeric ? 'p.id = $1::integer OR p.numero_pedido = $1::varchar' : 'p.numero_pedido = $1::varchar'}
    GROUP BY p.id
  `;
  const res = await pool.query(sql, [String(idOrNumero)]);
  return res.rows[0] || null;
}

// Obtener la carta completa desde MenuItem
export async function obtenerCartaDb() {
  try {
    const res = await pool.query(`
      SELECT id, nombre, descripcion, precio, categoria, sub, alergenos, imagen, activo, destacado
      FROM "MenuItem"
      WHERE activo = true
      ORDER BY categoria ASC, id ASC
    `);
    return res.rows.map(row => ({
      id: String(row.id),
      cat: row.categoria,
      categoria: row.categoria,
      ...(row.sub ? { sub: row.sub } : {}),
      nombre: fixCorruptedAccents(row.nombre),
      descripcion: fixCorruptedAccents(row.descripcion || ''),
      precio: Number(row.precio),
      imagen: row.imagen || '/images/placeholder.jpg',
      alergenos: row.alergenos ? row.alergenos.split(',').map(s => s.trim()).filter(Boolean) : [],
      destacado: Boolean(row.destacado)
    }));
  } catch (err) {
    console.warn('⚠️ Error al leer MenuItem de base de datos:', err.message);
    return null;
  }
}

// Registrar eventos de analítica y embudo de conversión
export async function registrarEventoAnalyticsDb({
  sessionId,
  tipo,
  pagina,
  dishId,
  dishNombre,
  cantidadItems = 0,
  totalCarrito = 0,
  metadata
}) {
  try {
    await pool.query(`
      INSERT INTO "AnalyticsEvent" ("sessionId", tipo, pagina, "dishId", "dishNombre", "cantidadItems", "totalCarrito", metadata, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      sessionId,
      tipo,
      pagina || '/',
      dishId || null,
      dishNombre || null,
      Number(cantidadItems) || 0,
      Number(totalCarrito) || 0,
      metadata || null
    ]);
    return true;
  } catch (err) {
    console.warn('⚠️ Error al registrar evento analytics:', err.message);
    return false;
  }
}

// Validar cupón de descuento en base de datos
export async function validarCuponDb(codigo, subtotal = 0) {
  try {
    const cleanCode = (codigo || '').trim().toUpperCase();
    if (!cleanCode) return { valido: false, error: 'Código de cupón vacío' };

    const res = await pool.query(`
      SELECT id, codigo, descripcion, descuento, tipo, minimo, activo, usos, "maxUsos"
      FROM "Cupon"
      WHERE UPPER(codigo) = $1
    `, [cleanCode]);

    if (res.rows.length === 0) {
      return { valido: false, error: 'El cupón introducido no existe.' };
    }

    const c = res.rows[0];
    if (!c.activo) {
      return { valido: false, error: 'Este cupón está desactivado actualmente.' };
    }

    if (c.maxUsos && c.usos >= c.maxUsos) {
      return { valido: false, error: 'Este cupón ha alcanzado el límite máximo de usos.' };
    }

    if (c.minimo && Number(subtotal) < Number(c.minimo)) {
      return {
        valido: false,
        error: `El pedido mínimo para aplicar este cupón es de ${Number(c.minimo).toFixed(2)} €.`
      };
    }

    let descuentoCalculado = 0;
    if (c.tipo === 'porcentaje') {
      descuentoCalculado = (Number(subtotal) * Number(c.descuento)) / 100;
    } else {
      descuentoCalculado = Math.min(Number(subtotal), Number(c.descuento));
    }

    return {
      valido: true,
      cupon: {
        id: c.id,
        codigo: c.codigo,
        descripcion: c.descripcion || '',
        tipo: c.tipo,
        descuento: Number(c.descuento),
        descuentoCalculado: Number(descuentoCalculado.toFixed(2)),
        minimo: c.minimo ? Number(c.minimo) : null
      }
    };
  } catch (err) {
    console.warn('⚠️ Error al validar cupón en DB:', err.message);
    return { valido: false, error: 'Error al comprobar cupón en el servidor' };
  }
}

// Incrementar uso de cupón al completar pedido
export async function incrementarUsoCuponDb(codigo) {
  try {
    const cleanCode = (codigo || '').trim().toUpperCase();
    if (!cleanCode) return false;
    await pool.query(`
      UPDATE "Cupon"
      SET usos = usos + 1
      WHERE UPPER(codigo) = $1
    `, [cleanCode]);
    return true;
  } catch (err) {
    console.warn('⚠️ Error al incrementar uso de cupón:', err.message);
    return false;
  }
}

// Obtener ofertas y promociones activas
export async function obtenerOfertasActivasDb() {
  try {
    const res = await pool.query(`
      SELECT id, titulo, descripcion, descuento, tipo, badge, "validoHasta", activo
      FROM "Oferta"
      WHERE activo = true
      ORDER BY id DESC
    `);
    return res.rows;
  } catch (err) {
    console.warn('⚠️ Error al obtener ofertas activas:', err.message);
    return [];
  }
}

// Obtener configuración del Bot Web sincronizada con el Dashboard
export async function obtenerBotWebConfigDb() {
  const DEFAULT_CONFIG = {
    activo: true,
    nombreBot: "Obentico",
    saludoInicial: "¡Hola! 🍣 Bienvenido a Obento Japanese Food. ¿Te apetece alguna recomendación de sushi para hoy??",
    systemPrompt: `Eres el Asistente Virtual Inteligente de la tienda online de "Obento Japanese Food" (Murcia, España).
Estás integrado directamente en la web obentojapanesefood.es para ayudar a los clientes mientras navegan por la carta.

Tu misión es:
1. Recomendar platos populares (Uramakis de salmón y atún, Gyozas crujientes, Yakisoba).
2. Guiar a los clientes para que añadan platos al carrito de pedidos.
3. Informar sobre horarios de recogida (Martes a Domingo 13:00-16:00 y 20:00-23:30).
4. Resolver dudas de alérgenos y opciones sin gluten.

Tono: Amigable, cordial, experto en gastronomía japonesa y orientado a incentivar que el cliente complete su pedido.`,
    posicion: "bottom-right",
    colorTema: "#c81e22",
    sugerencias: [
      "🍣 ¿Cuáles son los rollos más pedidos?",
      "🌾 ¿Tenéis opciones sin gluten?",
      "🕒 ¿Cuál es el horario de recogida hoy?"
    ]
  };

  try {
    const res = await pool.query(`SELECT valor FROM configuracion WHERE clave = 'bots_web_config'`);
    if (res.rows.length > 0 && res.rows[0].valor) {
      const parsed = JSON.parse(res.rows[0].valor);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
    return DEFAULT_CONFIG;
  } catch (err) {
    console.warn('⚠️ Error al obtener configuración de bots_web:', err.message);
    return DEFAULT_CONFIG;
  }
}

// Obtener claves de Stripe sincronizadas con el Dashboard / BBDD
export async function obtenerStripeConfigDb() {
  try {
    const res = await pool.query(
      `SELECT clave, valor FROM configuracion WHERE clave IN ('stripe_secret_key', 'stripe_publishable_key')`
    );
    const map = {};
    for (const row of res.rows) {
      map[row.clave] = row.valor;
    }
    return {
      secretKey: map['stripe_secret_key'] || null,
      publishableKey: map['stripe_publishable_key'] || null
    };
  } catch (err) {
    return { secretKey: null, publishableKey: null };
  }
}
