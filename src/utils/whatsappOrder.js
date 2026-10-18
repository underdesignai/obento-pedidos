/**
 * Genera el mensaje formateado para enviar a WhatsApp con los platos exactos del pedido.
 */
export function formatWhatsAppOrderMessage(cart = [], finalPrice = 0, platoIntentado = null) {
  const lineas = [];

  if (Array.isArray(cart) && cart.length > 0) {
    for (const it of cart) {
      const cant = it.cantidad || it.quantity || it.qty || 1;
      const nombre = it.nombre || it.name || 'Plato';
      const porcion = it.porcion ? ` (${it.porcion} uds)` : '';
      const opcion = it.opcion ? ` [${it.opcion}]` : '';
      const precioUnit = Number(it.precio || it.price || 0);
      const subtotal = Number(it.subtotal || (precioUnit * cant));
      const subtotalStr = subtotal > 0 ? ` - ${subtotal.toFixed(2).replace('.', ',')}€` : '';
      lineas.push(`• ${cant}x ${nombre}${porcion}${opcion}${subtotalStr}`);
    }
  } else if (platoIntentado?.dish) {
    const cant = platoIntentado.cantidad || 1;
    const nombre = platoIntentado.dish.nombre || platoIntentado.dish.name || 'Plato';
    const porcion = platoIntentado.portion?.cant ? ` (${platoIntentado.portion.cant} uds)` : '';
    const opcion = platoIntentado.opcion?.label ? ` [${platoIntentado.opcion.label}]` : '';
    const precioUnit = Number(
      platoIntentado.portion?.precio !== undefined
        ? platoIntentado.portion.precio
        : (platoIntentado.dish.precio || 0)
    );
    const subtotal = precioUnit * cant;
    const subtotalStr = subtotal > 0 ? ` - ${subtotal.toFixed(2).replace('.', ',')}€` : '';
    lineas.push(`• ${cant}x ${nombre}${porcion}${opcion}${subtotalStr}`);
    if (!finalPrice || finalPrice <= 0) {
      finalPrice = subtotal;
    }
  }

  if (lineas.length > 0) {
    let msg = '¡Hola Obento! 🍣 Quiero hacer un pedido:\n\n' + lineas.join('\n');
    if (finalPrice > 0) {
      msg += `\n\nTotal estimado: ${Number(finalPrice).toFixed(2).replace('.', ',')}€`;
    }
    return msg;
  }

  return 'Hola, quiero hacer un pedido';
}
