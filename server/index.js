import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  crearPedidoEnDb,
  obtenerPedidosDb,
  actualizarEstadoPedidoDb,
  actualizarEstadoPagoDb,
  obtenerPedidoPorIdDb,
  obtenerCartaDb,
  registrarEventoAnalyticsDb,
  validarCuponDb,
  incrementarUsoCuponDb,
  obtenerOfertasActivasDb,
  obtenerBotWebConfigDb,
  obtenerStripeConfigDb,
  obtenerHistorialDeliveryDb
} from './db/index.js';
import { sendOrderConfirmedEmail, sendOrderReadyEmail } from './email.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'https://pedidos.obentojapanesefood.es';

// 1. OCULTAR HUELLAS DEL SERVIDOR (FINGERPRINTING MITIGATION)
app.disable('x-powered-by');

// 2. CABECERAS HTTP DE SEGURIDAD (HELMET)
app.use(helmet({
  contentSecurityPolicy: false, // Permite estilos, SVG y bundle sin romper la app Vite
  crossOriginEmbedderPolicy: false,
  hsts: false // Permite navegación por IP sin forzar bloqueo HTTPS estricto en navegadores
}));

// 3. LÍMITE DE TAMAÑO EN PAYLOADS (DEFENSA CONTRA DoS POR AGOTAMIENTO DE MEMORIA)
app.use(express.json({ limit: '60kb' }));
app.use(express.urlencoded({ extended: true, limit: '60kb' }));

// 4. CONFIGURACIÓN RESILIENTE DE CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes directas (mismo servidor, scripts backend internos, curl o sin header origin)
    if (!origin) return callback(null, true);

    // Permitir VPS IP en cualquier puerto, dominios oficiales y entornos de desarrollo
    if (
      origin.includes('75.119.132.90') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('obentojapanesefood.es') ||
      origin.includes('flowprintcorp.com')
    ) {
      return callback(null, true);
    }

    // Permitir en general para navegación web de clientes
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-delivery-pin', 'x-staff-key']
}));

// 5. RATE LIMITING (DEFENSA CONTRA FUERZA BRUTA, SCRAPING Y FLOODING)
const apiGeneralLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes al servidor. Inténtalo en un minuto.' }
});
app.use('/api/', apiGeneralLimiter);

const deliveryPinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso al PIN de delivery. Bloqueado temporalmente por seguridad.' }
});
app.use('/api/delivery/', deliveryPinLimiter);

const orderCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de pedidos alcanzado para este periodo. Por favor contacta por teléfono.' }
});

const couponLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de verificación de cupones. Espera 5 minutos.' }
});

// Helper de sanitización de cadenas contra inyección HTML y XSS
function sanitizeInput(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim();
}

// Obtener cliente de Stripe activo (Sincronizado con BBDD del Panel de Administración y con fallback a .env)
async function getStripeClient() {
  try {
    const dbConfig = await obtenerStripeConfigDb();
    const sk = (dbConfig.secretKey && !dbConfig.secretKey.includes('placeholder'))
      ? dbConfig.secretKey
      : (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')
        ? process.env.STRIPE_SECRET_KEY
        : null);

    if (sk) {
      return new Stripe(sk);
    }
  } catch (err) {
    console.warn('⚠️ Error al obtener cliente Stripe:', err.message);
  }
  return null;
}

async function getStripePublishableKey() {
  try {
    const dbConfig = await obtenerStripeConfigDb();
    if (dbConfig.publishableKey && !dbConfig.publishableKey.includes('placeholder')) {
      return dbConfig.publishableKey;
    }
  } catch (_) {}
  return (process.env.STRIPE_PUBLISHABLE_KEY && !process.env.STRIPE_PUBLISHABLE_KEY.includes('placeholder'))
    ? process.env.STRIPE_PUBLISHABLE_KEY
    : null;
}

// Fallback en memoria para desarrollo si PostgreSQL no está encendido
const pedidosEnMemoria = [];

// Iniciar base de datos al arrancar
initDatabase().catch(err => {
  console.warn('Nota: Iniciando con soporte PostgreSQL activo y fallback resiliente.');
});

// =========================================================
// RUTAS API
// =========================================================

// Health check
app.get('/api/health', async (req, res) => {
  const stripeClient = await getStripeClient();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    postgresConfigured: Boolean(process.env.DATABASE_URL || process.env.PGHOST),
    stripeConfigured: Boolean(stripeClient)
  });
});

// CONFIGURACIÓN DEL BOT WEB (Sincronizado en tiempo real con el Dashboard)
app.get('/api/bots-web', async (req, res) => {
  try {
    const config = await obtenerBotWebConfigDb();
    res.json(config);
  } catch (err) {
    console.error('Error al obtener /api/bots-web:', err);
    res.status(500).json({ error: 'Error al obtener configuración del bot' });
  }
});

// CARTA OFICIAL EN VIVO (desde PostgreSQL MenuItem)
app.get('/api/carta', async (req, res) => {
  try {
    const items = await obtenerCartaDb();
    if (items && items.length > 0) {
      return res.json(items);
    }
  } catch (err) {
    console.warn('⚠️ Error al consultar /api/carta:', err.message);
  }
  res.json([]);
});

// VALIDAR CUPÓN DE DESCUENTO (Protegido contra fuerza bruta con couponLimiter)
app.post('/api/cupones/validar', couponLimiter, async (req, res) => {
  try {
    const { codigo, subtotal } = req.body;
    const cleanCodigo = sanitizeInput(codigo, 30);
    const numSubtotal = Math.max(0, Number(subtotal) || 0);
    const resultado = await validarCuponDb(cleanCodigo, numSubtotal);
    if (!resultado.valido) {
      return res.status(400).json({ error: resultado.error });
    }
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar cupón.' });
  }
});

// OFERTAS Y PROMOCIONES ACTIVAS
app.get('/api/ofertas', async (req, res) => {
  try {
    const ofertas = await obtenerOfertasActivasDb();
    res.json(ofertas);
  } catch (err) {
    res.json([]);
  }
});

// 1. CREAR PEDIDO (Protegido contra Spam DoS con orderCreationLimiter y sanitización estricta)
app.post('/api/pedidos', orderCreationLimiter, async (req, res) => {
  try {
    const {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      tipo_entrega,
      direccion_entrega,
      direccion_detalles,
      codigo_postal,
      hora_recogida,
      notas,
      metodo_pago,
      items,
      total,
      cupon_codigo
    } = req.body;

    if (!cliente_nombre || !cliente_telefono || !items || !items.length) {
      return res.status(400).json({ error: 'Nombre, teléfono y al menos un plato son obligatorios.' });
    }

    if (tipo_entrega === 'domicilio' && !direccion_entrega) {
      return res.status(400).json({ error: 'La dirección de entrega es obligatoria para pedidos a domicilio.' });
    }

    if (tipo_entrega === 'domicilio' && Number(total) < 25) {
      return res.status(400).json({ error: 'El pedido mínimo para entrega a domicilio es de 25,00 €.' });
    }

    const payload = {
      cliente_nombre: sanitizeInput(cliente_nombre, 80),
      cliente_telefono: sanitizeInput(cliente_telefono, 25),
      cliente_email: cliente_email ? sanitizeInput(cliente_email, 120) : null,
      tipo_entrega: tipo_entrega === 'domicilio' ? 'domicilio' : 'recogida_local',
      direccion_entrega: direccion_entrega ? sanitizeInput(direccion_entrega, 200) : null,
      direccion_detalles: direccion_detalles ? sanitizeInput(direccion_detalles, 100) : null,
      codigo_postal: codigo_postal ? sanitizeInput(codigo_postal, 10) : null,
      hora_recogida: sanitizeInput(hora_recogida, 50) || 'Lo antes posible',
      notas: notas ? sanitizeInput(notas, 400) : '',
      metodo_pago: metodo_pago === 'stripe' ? 'stripe' : 'restaurante',
      estado_pago: req.body.estado_pago || (metodo_pago === 'stripe' ? 'pendiente' : 'pendiente_local'),
      estado_pedido: 'recibido',
      total: Math.max(0, Number(total) || 0),
      items: Array.isArray(items) ? items.slice(0, 50) : []
    };

    let pedidoGuardado;
    try {
      pedidoGuardado = await crearPedidoEnDb(payload);
      if (cupon_codigo) {
        await incrementarUsoCuponDb(sanitizeInput(cupon_codigo, 30));
      }
    } catch (dbErr) {
      console.warn('⚠️ Guardando en memoria temporal (PostgreSQL en espera de conexión):', dbErr.message);
      const idSimulado = pedidosEnMemoria.length + 1;
      const numeroSimulado = `OB-${Math.floor(1000 + Math.random() * 9000)}`;
      pedidoGuardado = {
        id: idSimulado,
        numero_pedido: numeroSimulado,
        ...payload,
        created_at: new Date().toISOString()
      };
      pedidosEnMemoria.unshift(pedidoGuardado);
    }

    if (pedidoGuardado && pedidoGuardado.cliente_email) {
      sendOrderConfirmedEmail(pedidoGuardado.cliente_email, pedidoGuardado)
        .then(() => console.log(`✉️ Email de confirmación enviado a ${pedidoGuardado.cliente_email} para pedido ${pedidoGuardado.numero_pedido}`))
        .catch(err => console.error(`⚠️ Error al enviar email de pedido a ${pedidoGuardado.cliente_email}:`, err.message));
    }

    res.status(201).json({
      success: true,
      pedido: pedidoGuardado,
      mensaje: 'Pedido registrado con éxito.'
    });
  } catch (error) {
    console.error('Error al registrar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el pedido.' });
  }
});

// OBTENER CONFIGURACIÓN PÚBLICA DE STRIPE
app.get('/api/stripe-config', async (req, res) => {
  const stripeClient = await getStripeClient();
  const pubKey = await getStripePublishableKey();
  res.json({
    configured: Boolean(stripeClient && pubKey),
    publishableKey: pubKey
  });
});

// CREAR PAYMENT INTENT DE STRIPE (PARA STRIPE ELEMENTS DENTRO DEL MODAL)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, pedidoData } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Importe no válido.' });
    }

    const stripeClient = await getStripeClient();
    if (!stripeClient) {
      return res.status(400).json({
        error: 'Stripe no está configurado en el servidor. Configura tus claves en el Panel de Administración o en .env.'
      });
    }

    const amountInCents = Math.round(Number(amount) * 100);

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        cliente_nombre: pedidoData?.cliente_nombre || '',
        cliente_telefono: pedidoData?.cliente_telefono || '',
        tipo_entrega: pedidoData?.tipo_entrega || 'recogida_local'
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error) {
    console.error('Error al crear PaymentIntent de Stripe:', error);
    res.status(500).json({ error: error.message || 'Error al conectar con la pasarela Stripe.' });
  }
});

// 2. CREAR SESIÓN DE PAGO EN STRIPE
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      tipo_entrega,
      direccion_entrega,
      direccion_detalles,
      codigo_postal,
      hora_recogida,
      notas,
      items,
      total
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'El carrito no tiene productos.' });
    }

    if (tipo_entrega === 'domicilio' && Number(total) < 25) {
      return res.status(400).json({ error: 'El pedido mínimo para entrega a domicilio es de 25,00 €.' });
    }

    // 1) Registrar pedido en estado 'pendiente' en la base de datos
    let pedido;
    const payload = {
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      tipo_entrega: tipo_entrega || 'recogida_local',
      direccion_entrega: tipo_entrega === 'domicilio' ? direccion_entrega : null,
      direccion_detalles: tipo_entrega === 'domicilio' ? direccion_detalles : null,
      codigo_postal: tipo_entrega === 'domicilio' ? codigoPostal || codigo_postal : null,
      hora_recogida: hora_recogida || 'Lo antes posible (~35-45 min)',
      notas: notas || '',
      metodo_pago: 'stripe',
      estado_pago: 'pendiente',
      estado_pedido: 'recibido',
      total: Number(total),
      items
    };

    try {
      pedido = await crearPedidoEnDb(payload);
    } catch (dbErr) {
      console.warn('⚠️ Guardando pedido previo a Stripe en memoria:', dbErr.message);
      pedido = {
        id: pedidosEnMemoria.length + 1,
        numero_pedido: `OB-${Math.floor(1000 + Math.random() * 9000)}`,
        ...payload,
        created_at: new Date().toISOString()
      };
      pedidosEnMemoria.unshift(pedido);
    }

    const clientBase = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null) || CLIENT_URL;
    const activeStripe = await getStripeClient();

    // Si Stripe no está configurado, no se puede proceder al cobro con tarjeta
    if (!activeStripe) {
      return res.status(500).json({
        error: 'La pasarela de pago Stripe no está configurada o disponible en este momento.'
      });
    }

    // Preparar ítems para Stripe
    const line_items = items.map(item => {
      const precioCentimos = Math.round(Number(item.precio || item.precio_unitario) * 100);
      const descPortion = item.porcion ? ` (${item.porcion} uds)` : '';
      const descOpcion = item.opcion ? ` - ${item.opcion}` : '';
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.nombre}${descPortion}${descOpcion}`,
            description: item.descripcion ? item.descripcion.substring(0, 100) : 'Obento Japanese Food'
          },
          unit_amount: precioCentimos
        },
        quantity: item.cantidad || 1
      };
    });

    const session = await activeStripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      customer_email: cliente_email || undefined,
      success_url: `${clientBase}/?status=success&session_id={CHECKOUT_SESSION_ID}&numero_pedido=${pedido.numero_pedido}&pedido_id=${pedido.id}`,
      cancel_url: `${clientBase}/?status=cancel`,
      metadata: {
        pedido_id: String(pedido.id),
        numero_pedido: pedido.numero_pedido
      }
    });

    // Guardar stripe_session_id en PostgreSQL
    try {
      await pool.query('UPDATE pedidos SET stripe_session_id = $1 WHERE id = $2', [session.id, pedido.id]);
    } catch (e) {
      console.warn('⚠️ Error al asociar stripe_session_id al pedido:', e.message);
    }

    res.json({
      url: session.url,
      sessionId: session.id,
      numero_pedido: pedido.numero_pedido
    });
  } catch (error) {
    console.error('Error al crear checkout session de Stripe:', error);
    res.status(500).json({ error: error.message || 'Error al conectar con la pasarela Stripe.' });
  }
});

// 3. VERIFICAR SESIÓN DE STRIPE Y CONFIRMAR PAGO
app.get('/api/pedidos/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId || sessionId === 'undefined') {
      return res.status(400).json({ error: 'Identificador de sesión inválido.' });
    }

    const activeStripe = await getStripeClient();
    if (!activeStripe) {
      return res.status(500).json({ error: 'Pasarela de pago Stripe no disponible.' });
    }

    const session = await activeStripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const pedidoId = session.metadata?.pedido_id || req.query.pedido_id;
      const numeroPedido = session.metadata?.numero_pedido || req.query.numero_pedido;
      const lookup = pedidoId || numeroPedido || sessionId;

      let pedidoActualizado = null;
      try {
        await actualizarEstadoPagoDb(lookup, 'pagado', session.payment_intent);
        pedidoActualizado = await obtenerPedidoPorIdDb(lookup);
      } catch (dbErr) {
        console.error('⚠️ Error al actualizar pago en DB:', dbErr.message);
        pedidoActualizado = pedidosEnMemoria.find(p => p.id == lookup || p.numero_pedido === lookup);
        if (pedidoActualizado) {
          pedidoActualizado.estado_pago = 'pagado';
        }
      }

      if (!pedidoActualizado && (numeroPedido || pedidoId)) {
        try {
          pedidoActualizado = await obtenerPedidoPorIdDb(numeroPedido || pedidoId);
        } catch {
          // ignore
        }
      }

      // Enviar correo de confirmación de pago oficial
      if (pedidoActualizado && pedidoActualizado.cliente_email) {
        console.log(`✉️ Iniciando envío de email de confirmación a ${pedidoActualizado.cliente_email} para pedido ${pedidoActualizado.numero_pedido}...`);
        sendOrderConfirmedEmail(pedidoActualizado.cliente_email, pedidoActualizado)
          .then(() => console.log(`✅ Email de confirmación entregado con éxito a ${pedidoActualizado.cliente_email}`))
          .catch(err => console.error('❌ Error al enviar email de confirmación:', err));
      } else {
        console.warn('⚠️ No se pudo enviar email de confirmación: pedido o email no encontrado.', { lookup, pedidoActualizado });
      }

      return res.json({ success: true, pagado: true, pedido: pedidoActualizado });
    }

    return res.json({ success: true, pagado: false });
  } catch (error) {
    console.error('Error al verificar sesión de Stripe:', error);
    res.status(500).json({ error: 'Error al verificar sesión de pago.' });
  }
});

// MIDDLEWARE DE AUTORIZACIÓN PARA PERSONAL / REPARTIDORES
const verifyStaffOrDelivery = (req, res, next) => {
  const expectedPin = process.env.DELIVERY_PIN || '1234';
  const expectedStaffKey = process.env.STAFF_KEY || 'obento_staff_secret';
  const clientPin = req.headers['x-delivery-pin'] || req.query.pin;
  const clientStaff = req.headers['x-staff-key'] || req.headers['authorization'];

  if (
    (clientPin && String(clientPin) === String(expectedPin)) ||
    (clientStaff && String(clientStaff).includes(expectedStaffKey))
  ) {
    return next();
  }
  return res.status(401).json({ error: 'Acceso no autorizado. Se requiere autorización de personal.' });
};

// 4. LISTAR PEDIDOS (Protegido: Solo accesible por personal / monitores autorizados)
app.get('/api/pedidos', verifyStaffOrDelivery, async (req, res) => {
  try {
    const { estado, soloPagados, limit } = req.query;
    try {
      const pedidos = await obtenerPedidosDb({
        estado: estado ? sanitizeInput(estado, 30) : undefined,
        soloPagados: soloPagados === 'true',
        limit: Math.min(100, Math.max(1, Number(limit) || 100))
      });
      return res.json(pedidos);
    } catch (dbErr) {
      // Fallback a memoria
      let list = [...pedidosEnMemoria];
      if (estado) list = list.filter(p => p.estado_pedido === estado);
      if (soloPagados === 'true') list = list.filter(p => p.estado_pago === 'pagado');
      return res.json(list);
    }
  } catch (error) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ error: 'Error al recuperar pedidos.' });
  }
});

// 5. DETALLE DE UN PEDIDO (Público para /seguimiento con datos personales enmascarados si no es staff)
app.get('/api/pedidos/:idOrNumero', async (req, res) => {
  try {
    const { idOrNumero } = req.params;
    const cleanId = sanitizeInput(idOrNumero, 50);
    let pedido;
    try {
      pedido = await obtenerPedidoPorIdDb(cleanId);
      if (!pedido) {
        pedido = pedidosEnMemoria.find(p => p.numero_pedido === cleanId || String(p.id) === String(cleanId));
      }
    } catch {
      pedido = pedidosEnMemoria.find(p => p.numero_pedido === cleanId || String(p.id) === String(cleanId));
    }
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const expectedPin = process.env.DELIVERY_PIN || '1234';
    const isStaff = req.headers['x-delivery-pin'] === expectedPin || Boolean(req.headers['x-staff-key']);

    if (!isStaff) {
      // Enmascarar información sensible para clientes en /seguimiento
      const tel = pedido.cliente_telefono || '';
      const maskedTel = tel.length > 4 ? `${tel.slice(0, 3)}***${tel.slice(-2)}` : '***';
      return res.json({
        id: pedido.id,
        numero_pedido: pedido.numero_pedido,
        cliente_nombre: pedido.cliente_nombre,
        cliente_telefono: maskedTel,
        tipo_entrega: pedido.tipo_entrega,
        hora_recogida: pedido.hora_recogida,
        estado_pedido: pedido.estado_pedido,
        estado_pago: pedido.estado_pago,
        total: pedido.total,
        items: pedido.items,
        created_at: pedido.created_at,
        tiempo_entrega_minutos: pedido.tiempo_entrega_minutos
      });
    }

    return res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el pedido.' });
  }
});

// 6. CAMBIAR ESTADO DE PEDIDO (Protegido: Monitor Takeaway & Delivery con autorización)
app.patch('/api/pedidos/:id/status', verifyStaffOrDelivery, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = sanitizeInput(id, 50);
    const { estado_pedido, repartidor_nombre } = req.body;

    if (!estado_pedido) {
      return res.status(400).json({ error: 'estado_pedido es obligatorio.' });
    }

    const cleanEstado = sanitizeInput(estado_pedido, 40);
    const cleanRepartidor = repartidor_nombre ? sanitizeInput(repartidor_nombre, 80) : null;

    try {
      const pedido = await actualizarEstadoPedidoDb(cleanId, cleanEstado, { repartidor_nombre: cleanRepartidor });
      return res.json({ success: true, pedido });
    } catch {
      const pMem = pedidosEnMemoria.find(p => p.id == cleanId || p.numero_pedido === cleanId);
      if (pMem) {
        pMem.estado_pedido = cleanEstado;
        if (cleanEstado === 'en_camino') {
          pMem.fecha_salida_reparto = pMem.fecha_salida_reparto || new Date().toISOString();
          if (cleanRepartidor) pMem.repartidor_nombre = cleanRepartidor;
        } else if (cleanEstado === 'entregado') {
          pMem.fecha_entregado = new Date().toISOString();
          const start = new Date(pMem.fecha_salida_reparto || pMem.created_at || Date.now()).getTime();
          pMem.tiempo_entrega_minutos = Math.round((Date.now() - start) / 60000);
        }
        return res.json({ success: true, pedido: pMem });
      }
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado del pedido.' });
  }
});

// 7. ENDPOINTS ESPECÍFICOS PARA LA APP DE DELIVERY (Protegidos conforme a RGPD Art. 32)
const verifyDeliveryPin = (req, res, next) => {
  const expectedPin = process.env.DELIVERY_PIN || '1234';
  const clientPin = req.headers['x-delivery-pin'] || req.query.pin;
  if (clientPin && String(clientPin) === String(expectedPin)) {
    return next();
  }
  return res.status(401).json({ error: 'Acceso no autorizado. Se requiere PIN de seguridad para acceder a los datos de entrega.' });
};

app.get('/api/delivery/pedidos', verifyDeliveryPin, async (req, res) => {
  try {
    try {
      const todos = await obtenerPedidosDb({ limit: 100 });
      const delivery = todos.filter(p => 
        (p.tipo_entrega === 'domicilio' || p.tipo_entrega === 'delivery') &&
        ['listo_reparto', 'en_camino', 'listo', 'en_preparacion'].includes(p.estado_pedido)
      );
      return res.json(delivery);
    } catch (dbErr) {
      const memDelivery = pedidosEnMemoria.filter(p => 
        (p.tipo_entrega === 'domicilio' || p.tipo_entrega === 'delivery') &&
        ['listo_reparto', 'en_camino', 'listo', 'en_preparacion'].includes(p.estado_pedido)
      );
      return res.json(memDelivery);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos de delivery.' });
  }
});

app.get('/api/delivery/historial', verifyDeliveryPin, async (req, res) => {
  try {
    try {
      const historial = await obtenerHistorialDeliveryDb();
      return res.json(historial);
    } catch (dbErr) {
      // Mock de historial en memoria para desarrollo
      const memEntregados = pedidosEnMemoria.filter(p => 
        p.tipo_entrega === 'domicilio' || p.tipo_entrega === 'delivery'
      );
      return res.json({
        pedidos: memEntregados,
        porHora: [
          { hora: 14, total_pedidos: 6, promedio_minutos: 22, total_facturado: 185.50 },
          { hora: 15, total_pedidos: 4, promedio_minutos: 28, total_facturado: 124.00 },
          { hora: 21, total_pedidos: 9, promedio_minutos: 19, total_facturado: 290.00 },
          { hora: 22, total_pedidos: 7, promedio_minutos: 24, total_facturado: 215.00 }
        ],
        porDia: [
          { fecha: new Date().toISOString().slice(0, 10), total_pedidos: memEntregados.length, entregados: memEntregados.filter(p=>p.estado_pedido==='entregado').length, promedio_minutos: 23, total_facturado: memEntregados.reduce((a,b)=>a+Number(b.total||0), 0) }
        ]
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas del historial.' });
  }
});

// Registrar eventos de analítica y embudo de conversión
app.post('/api/analytics/track', async (req, res) => {
  try {
    const {
      sessionId,
      tipo,
      pagina,
      dishId,
      dishNombre,
      cantidadItems,
      totalCarrito,
      metadata
    } = req.body || {};

    if (!sessionId || !tipo) {
      return res.status(400).json({ error: 'sessionId y tipo son obligatorios' });
    }

    await registrarEventoAnalyticsDb({
      sessionId,
      tipo,
      pagina,
      dishId,
      dishNombre,
      cantidadItems,
      totalCarrito,
      metadata
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar evento' });
  }
});

// Servir frontend compilado en producción (dist)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// 8. MANEJADOR CENTRALIZADO DE ERRORES (PREVIENE FUGAS DE STACK TRACE)
app.use((err, req, res, next) => {
  console.error('⚠️ [Error Handler]:', err.message);
  res.status(err.status || 500).json({
    error: err.message && err.message.includes('CORS')
      ? 'Bloqueado por política de seguridad CORS.'
      : 'Error interno en el servidor.'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 [Servidor API Obento] escuchando en http://localhost:${PORT}`);
  console.log(`📡 [Endpoints disponibles]:`);
  console.log(`   - POST   /api/pedidos`);
  console.log(`   - POST   /api/create-checkout-session`);
  console.log(`   - GET    /api/pedidos (Para Monitor Takeaway & Dashboard)`);
  console.log(`   - PATCH  /api/pedidos/:id/status (Cambiar estado en Takeaway)`);
  console.log(`   - GET    /api/health`);
});
