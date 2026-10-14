import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { pool } from './db/index.js';

/**
 * Obtiene credenciales de email prioritariamente desde variables de entorno (.env)
 * o desde la tabla 'configuracion' (email_config) de PostgreSQL configurada en el dashboard.
 */
async function getEmailCredentials() {
  let from = process.env.EMAIL_FROM || 'pedidos@obentojapanesefood.es';
  let resendKey = process.env.RESEND_API_KEY;
  let pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD;
  let host = process.env.SMTP_HOST;
  let port = process.env.SMTP_PORT;

  if (!pass && !resendKey) {
    try {
      const res = await pool.query(
        "SELECT valor FROM configuracion WHERE clave = 'email_config' LIMIT 1"
      );
      if (res.rows.length > 0) {
        const cfg = JSON.parse(res.rows[0].valor);
        if (cfg.from) from = cfg.from;
        if (cfg.resend_key) resendKey = cfg.resend_key;
        if (cfg.password) pass = cfg.password;
        if (cfg.host) host = cfg.host;
        if (cfg.port) port = cfg.port;
      }
    } catch {
      // Ignorar si no hay tabla configuracion aún
    }
  }

  return { from, pass, host, port, resendKey };
}

/**
 * Crea o retorna el transporter configurado
 */
async function getTransporter() {
  const { from, pass, host, port, resendKey } = await getEmailCredentials();

  // 1. Prioridad: Resend API (Oficial y transaccional para pedidos@obentojapanesefood.es)
  if (resendKey) {
    const resend = new Resend(resendKey);
    return {
      transporter: {
        sendMail: async ({ from: sender, to, subject, html }) => {
          const res = await resend.emails.send({
            from: sender || `OBENTO Japanese Food <${from}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html
          });
          if (res.error) {
            throw new Error(res.error.message);
          }
          return res;
        }
      },
      from: `OBENTO Japanese Food <${from}>`
    };
  }

  if (!pass) {
    return { transporter: null, from: from || 'pedidos@obentojapanesefood.es' };
  }

  // 2. Si es una cuenta de Gmail
  if (from.toLowerCase().endsWith('@gmail.com') && !host) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: { user: from, pass }
      }),
      from: `"OBENTO Japanese Food" <${from}>`
    };
  }

  // 3. Por defecto para SMTP estándar (Hostinger SMTP, etc.)
  const smtpHost = host || 'smtp.hostinger.com';
  const smtpPort = Number(port) || 465;
  const isSecure = smtpPort === 465;

  return {
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: from,
        pass: pass
      }
    }),
    from: `"OBENTO Japanese Food" <${from}>`
  };
}

/**
 * Plantilla HTML base con diseño corporativo Obento
 */
function baseEmailLayout(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#0d0d12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;">
    <div style="max-width:580px;margin:30px auto;background:#15151c;border-radius:14px;overflow:hidden;border:1px solid rgba(200,30,34,0.35);box-shadow:0 15px 35px rgba(0,0,0,0.6);">
      
      <!-- Cabecera Obento -->
      <div style="background:linear-gradient(135deg, #180507 0%, #0d0d12 100%);padding:28px 32px;display:flex;align-items:center;border-bottom:1px solid rgba(200,30,34,0.25);">
        <div style="border-left:4px solid #c81e22;padding-left:14px;">
          <div style="font-size:24px;font-weight:900;letter-spacing:0.18em;color:#f3ede0;line-height:1;">
            OBENTO
          </div>
          <div style="font-size:11px;color:#c81e22;text-transform:uppercase;letter-spacing:0.25em;margin-top:4px;font-weight:700;">
            Japanese Food · La Ñora
          </div>
        </div>
      </div>

      <!-- Contenido Principal -->
      <div style="padding:32px 32px 28px;">
        ${content}
      </div>

      <!-- Pie de página -->
      <div style="background:#0e0e14;padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="font-size:12px;color:#9ca3af;margin:0 0 6px;line-height:1.5;">
          📍 C. Amargura, 3 · 30830 La Ñora, Murcia · 📞 Tel. 613 927 596
        </p>
        <p style="font-size:11px;color:#6b7280;margin:0;">
          © ${new Date().getFullYear()} Obento Japanese Food · Todos los derechos reservados.
        </p>
      </div>

    </div>
  </body>
  </html>`;
}

function itemsTableHtml(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#f3ede0;">
        <strong style="color:#c81e22;">${it.cantidad || 1}x</strong> ${it.nombre}
        ${it.porcion ? `<span style="color:#9ca3af;font-size:12px;"> (${it.porcion} uds)</span>` : ''}
        ${it.opcion ? `<span style="color:#9ca3af;font-size:12px;"> - ${it.opcion}</span>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#f3ede0;text-align:right;font-family:monospace;font-weight:bold;">
        ${Number(it.subtotal || (it.precio_unitario * (it.cantidad || 1)) || 0).toFixed(2).replace('.', ',')} €
      </td>
    </tr>`
    )
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;margin:18px 0 24px;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;">Plato</th>
          <th style="text-align:right;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:8px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}

/**
 * 1. Enviar Email de Pedido Recibido y Pagado (Inmediato tras pago Stripe o confirmación web)
 */
export async function sendOrderConfirmedEmail(to, data) {
  if (!to) return;
  const { transporter, from: emailFrom } = await getTransporter();

  const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/seguimiento?id=${data.numero_pedido}`;

  const html = baseEmailLayout(`
    <div style="display:inline-block;padding:5px 12px;border-radius:20px;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);color:#4ade80;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">
      🟢 Pedido Confirmado & Pagado
    </div>
    <h1 style="font-size:24px;color:#f3ede0;margin:0 0 10px;font-weight:800;">
      ¡Gracias por tu pedido, ${data.cliente_nombre}! 🍣
    </h1>
    <p style="color:#d1d5db;font-size:15px;line-height:1.5;margin:0 0 22px;">
      Hemos recibido tu pedido correctamente. La cocina de Obento ya ha recibido la comanda y está preparando tus platos con ingredientes frescos del día.
    </p>

    <!-- Caja del Pedido -->
    <div style="background:rgba(200,30,34,0.08);border:1px solid rgba(200,30,34,0.3);border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.15em;">NÚMERO DE PEDIDO</span>
        <span style="font-family:monospace;font-size:24px;font-weight:900;color:#c81e22;letter-spacing:0.05em;">${data.numero_pedido}</span>
      </div>
      <div style="font-size:13px;color:#d1d5db;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;margin-top:6px;">
        🕐 <strong>Hora estimada de recogida:</strong> <span style="color:#f3ede0;">${data.hora_recogida || 'Lo antes posible (~25-35 min)'}</span>
      </div>
      <div style="font-size:13px;color:#d1d5db;margin-top:6px;">
        📍 <strong>Lugar de recogida:</strong> <span style="color:#f3ede0;">C. Amargura, 3, La Ñora (Murcia)</span>
      </div>
    </div>

    <!-- Botón de Seguimiento en Vivo -->
    <div style="text-align:center;margin:30px 0 25px;">
      <a href="${trackingUrl}" target="_blank" style="display:inline-block;padding:14px 28px;border-radius:8px;background:linear-gradient(135deg, #c81e22 0%, #99151b 100%);color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;box-shadow:0 4px 18px rgba(200,30,34,0.4);">
        🔴 Seguir Estado de mi Pedido en Directo →
      </a>
      <p style="font-size:12px;color:#9ca3af;margin-top:10px;">
        Haz clic arriba para ver la barra de progreso en vivo cuando cocina empiece o termine tus platos.
      </p>
    </div>

    <!-- Resumen de Platos -->
    ${itemsTableHtml(data.items)}

    <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0 0;border-top:2px solid rgba(255,255,255,0.1);">
      <span style="font-size:16px;font-weight:700;color:#f3ede0;">Total abonado:</span>
      <span style="font-size:22px;font-weight:900;color:#c81e22;font-family:monospace;">${Number(data.total).toFixed(2).replace('.', ',')} €</span>
    </div>
  `);

  if (!transporter) {
    console.log(`ℹ️ [Email Simulado / Pendiente Credenciales] Para: ${to} | Asunto: Pedido Confirmado ${data.numero_pedido}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to,
      subject: `¡Pedido confirmado! · ${data.numero_pedido} · OBENTO Japanese Food`,
      html
    });
    console.log(`✉️ Email de confirmación enviado con éxito a ${to} para el pedido ${data.numero_pedido}`);
  } catch (err) {
    console.error(`⚠️ Error al enviar email de confirmación a ${to}:`, err.message);
  }
}

/**
 * 2. Enviar Email de Pedido Listo para recoger (Automático cuando cocina pulsa "Listo")
 */
export async function sendOrderReadyEmail(to, data) {
  if (!to) return;
  const { transporter, from: emailFrom } = await getTransporter();

  const trackingUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/seguimiento?id=${data.numero_pedido}`;

  const html = baseEmailLayout(`
    <div style="display:inline-block;padding:5px 12px;border-radius:20px;background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#22c55e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">
      🍣 ¡Recién Preparado!
    </div>
    <h1 style="font-size:26px;color:#22c55e;margin:0 0 10px;font-weight:900;">
      ¡Tu pedido ya está listo para recoger! 🥡
    </h1>
    <p style="color:#d1d5db;font-size:15px;line-height:1.5;margin:0 0 22px;">
      Hola <strong>${data.cliente_nombre}</strong>, nuestro equipo de sushiman acaba de empaquetar tu pedido. Ya puedes pasar a recogerlo al local.
    </p>

    <!-- Tarjeta del Pedido -->
    <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:18px 22px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.15em;">NÚMERO DE PEDIDO</span>
        <span style="font-family:monospace;font-size:24px;font-weight:900;color:#f3ede0;letter-spacing:0.05em;">${data.numero_pedido}</span>
      </div>
      <div style="font-size:14px;color:#e5e7eb;margin-top:6px;">
        📍 <strong>Dirección de recogida:</strong> C. Amargura, 3, 30830 La Ñora, Murcia
      </div>
      <div style="font-size:13px;color:#9ca3af;margin-top:6px;">
        Muestra tu número de pedido <strong>${data.numero_pedido}</strong> en la barra o mostrador.
      </div>
    </div>

    <div style="text-align:center;margin:24px 0;">
      <a href="${trackingUrl}" target="_blank" style="display:inline-block;padding:12px 24px;border-radius:8px;background:rgba(255,255,255,0.08);color:#f3ede0;text-decoration:none;font-weight:700;font-size:13px;border:1px solid rgba(255,255,255,0.15);">
        Ver Comprobante de Entrega →
      </a>
    </div>

    <p style="font-size:13px;color:#9ca3af;text-align:center;margin-top:20px;">
      ¡Muchísimas gracias por confiar en Obento Japanese Food! ¡Itadakimasu! 🥢
    </p>
  `);

  if (!transporter) {
    console.log(`ℹ️ [Email Simulado / Pendiente Credenciales] Para: ${to} | Asunto: Pedido Listo ${data.numero_pedido}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: emailFrom,
      to,
      subject: `¡Tu pedido ya está listo para recoger! · ${data.numero_pedido} · OBENTO`,
      html
    });
    console.log(`✉️ Email de pedido listo enviado con éxito a ${to} para el pedido ${data.numero_pedido}`);
  } catch (err) {
    console.error(`⚠️ Error al enviar email de pedido listo a ${to}:`, err.message);
  }
}
