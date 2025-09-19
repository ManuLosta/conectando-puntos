export interface WhatsAppFormattedMessage {
  text?: string;
  interactive?: WhatsAppInteractiveMessage;
}

export interface WhatsAppInteractiveMessage {
  type: "button" | "list";
  header?: {
    type: "text";
    text: string;
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: ButtonAction | ListAction;
}

export interface ButtonAction {
  buttons: Array<{
    type: "reply";
    reply: {
      id: string;
      title: string;
    };
  }>;
}

export interface ListAction {
  button: string;
  sections: Array<{
    title?: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

export class WhatsAppFormatterService {
  /**
   * Formats a text message with proper WhatsApp formatting
   */
  static formatText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, "*$1*") // Bold: **text** -> *text*
      .replace(/__(.*?)__/g, "_$1_") // Italic: __text__ -> _text_
      .replace(/~~(.*?)~~/g, "~$1~") // Strikethrough: ~~text~~ -> ~text~
      .replace(/`(.*?)`/g, "```$1```"); // Code: `text` -> ```text```
  }

  /**
   * Split order creation into multiple messages: info + confirmation
   */
  static createOrderMessages(orderData: {
    clientName: string;
    items: Array<{
      quantity: number;
      product: string;
      sku: string;
      stock: number;
      price: number;
    }>;
    recommendations?: Array<{
      product: string;
      sku: string;
      reason: string;
      price: number;
    }>;
    total: number;
    orderId: string;
  }): WhatsAppFormattedMessage[] {
    // Mensaje 1: Información completa de la orden
    const header = `🧾 *Pedido para ${orderData.clientName}*`;
    let infoBody = `${header}\n\n`;

    // Items section
    infoBody += `📦 *PRODUCTOS SOLICITADOS:*\n`;
    orderData.items.forEach((item, index) => {
      const stockStatus =
        item.stock > 0 ? `✅ Stock: ${item.stock}` : `❌ Sin stock`;
      infoBody += `${index + 1}. ${item.quantity}× *${item.product}* (${item.sku})\n   ${stockStatus} • $${item.price.toFixed(2)}\n\n`;
    });

    // Recommendations section
    if (orderData.recommendations && orderData.recommendations.length > 0) {
      infoBody += `💡 *RECOMENDACIONES ADICIONALES:*\n`;
      orderData.recommendations.forEach((rec, index) => {
        infoBody += `${index + 1}. *${rec.product}* (${rec.sku})\n   💰 $${rec.price.toFixed(2)} • ${rec.reason}\n\n`;
      });
    }

    infoBody += `💰 *Total estimado:* $${orderData.total.toFixed(2)}\n`;
    infoBody += `🆔 *ID del pedido:* ${orderData.orderId}`;

    // Mensaje 2: Solicitud de confirmación
    const confirmationMessage = this.createConfirmation(
      "¿Deseas confirmar este pedido?",
      orderData.orderId,
    );

    return [{ text: this.formatText(infoBody) }, confirmationMessage];
  }

  /**
   * Creates a structured order summary message
   */
  static createOrderSummary(orderData: {
    clientName: string;
    items: Array<{
      quantity: number;
      product: string;
      sku: string;
      stock: number;
      price: number;
    }>;
    recommendations?: Array<{
      product: string;
      sku: string;
      reason: string;
      price: number;
    }>;
    total: number;
    orderId: string;
  }): WhatsAppFormattedMessage {
    const header = `🧾 *Pedido para ${orderData.clientName}*`;

    let body = `${header}\n\n`;

    // Items section
    body += `📦 *PRODUCTOS SOLICITADOS:*\n`;
    orderData.items.forEach((item, index) => {
      const stockStatus =
        item.stock > 0 ? `✅ Stock: ${item.stock}` : `❌ Sin stock`;
      body += `${index + 1}. ${item.quantity}× *${item.product}* (${item.sku})\n   ${stockStatus} • $${item.price.toFixed(2)}\n\n`;
    });

    // Recommendations section
    if (orderData.recommendations && orderData.recommendations.length > 0) {
      body += `💡 *RECOMENDACIONES ADICIONALES:*\n`;
      orderData.recommendations.forEach((rec, index) => {
        body += `${index + 1}. *${rec.product}* (${rec.sku})\n   💰 $${rec.price.toFixed(2)} • ${rec.reason}\n\n`;
      });
    }

    body += `💰 *Total estimado:* $${orderData.total.toFixed(2)}\n`;
    body += `🆔 *ID del pedido:* ${orderData.orderId}`;

    return {
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: "🧾 Resumen del Pedido",
        },
        body: {
          text: body,
        },
        footer: {
          text: "¿Deseas confirmar este pedido?",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: `confirm_order_${orderData.orderId}`,
                title: "✅ Confirmar",
              },
            },
            {
              type: "reply",
              reply: {
                id: `modify_order_${orderData.orderId}`,
                title: "✏️ Modificar",
              },
            },
            {
              type: "reply",
              reply: {
                id: `cancel_order_${orderData.orderId}`,
                title: "❌ Cancelar",
              },
            },
          ],
        },
      },
    };
  }

  /**
   * Creates a product suggestions list message
   */
  static createProductSuggestions(
    suggestions: Array<{
      rank: number;
      product: string;
      sku: string;
      price: number;
      reason: string;
      discount?: number;
    }>,
    clientName: string,
  ): WhatsAppFormattedMessage {
    let body = `💡 *Sugerencias para ${clientName}*\n\n`;

    suggestions.forEach((suggestion) => {
      const discountText = suggestion.discount
        ? ` 🏷️ *${suggestion.discount}% OFF*`
        : "";
      body += `*${suggestion.rank}.* *${suggestion.product}*${discountText}\n`;
      body += `   📦 SKU: ${suggestion.sku}\n`;
      body += `   💰 $${suggestion.price.toFixed(2)}\n`;
      body += `   📊 ${suggestion.reason}\n\n`;
    });

    return {
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: "🎯 Productos Recomendados",
        },
        body: {
          text: body.trim(),
        },
        footer: {
          text: "Selecciona productos para agregar",
        },
        action: {
          button: "Ver Productos",
          sections: [
            {
              title: "Productos Sugeridos",
              rows: suggestions.map((suggestion) => ({
                id: `add_product_${suggestion.sku}`,
                title: suggestion.product,
                description: `$${suggestion.price.toFixed(2)} • ${suggestion.reason}`,
              })),
            },
          ],
        },
      },
    };
  }

  /**
   * Creates a client search results message
   */
  static createClientSearchResults(
    clients: Array<{
      id: string;
      name: string;
      phone?: string;
      address?: string;
    }>,
  ): WhatsAppFormattedMessage {
    if (clients.length === 0) {
      return {
        text: "❌ *No se encontraron clientes*\n\nIntenta con otro nombre o verifica la ortografía.",
      };
    }

    if (clients.length === 1) {
      const client = clients[0];
      return {
        text: `✅ *Cliente encontrado:*\n\n🏪 *${client.name}*\n📱 ${client.phone || "N/A"}\n📍 ${client.address || "N/A"}`,
      };
    }

    return {
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: "🔍 Resultados de Búsqueda",
        },
        body: {
          text: `Encontré *${clients.length} clientes* similares:\n\nSelecciona el cliente correcto:`,
        },
        footer: {
          text: "Toca para seleccionar cliente",
        },
        action: {
          button: "Seleccionar Cliente",
          sections: [
            {
              title: "Clientes Encontrados",
              rows: clients.map((client) => ({
                id: `select_client_${client.id}`,
                title: client.name,
                description: client.phone
                  ? `📱 ${client.phone}`
                  : "Sin teléfono",
              })),
            },
          ],
        },
      },
    };
  }

  /**
   * Creates a stock status message
   */
  static createStockStatus(
    products: Array<{
      product: string;
      sku: string;
      requestedQty: number;
      availableStock: number;
      price: number;
    }>,
  ): WhatsAppFormattedMessage {
    let body = `📦 *ESTADO DEL STOCK*\n\n`;

    products.forEach((product) => {
      const statusIcon =
        product.availableStock >= product.requestedQty ? "✅" : "⚠️";
      const statusText =
        product.availableStock >= product.requestedQty
          ? "Disponible"
          : `Solo ${product.availableStock} disponibles`;

      body += `${statusIcon} *${product.product}*\n`;
      body += `   📦 SKU: ${product.sku}\n`;
      body += `   🛒 Solicitado: ${product.requestedQty}\n`;
      body += `   📊 Stock: ${product.availableStock} (${statusText})\n`;
      body += `   💰 $${product.price.toFixed(2)}\n\n`;
    });

    return {
      text: this.formatText(body.trim()),
    };
  }

  /**
   * Creates a confirmation message
   */
  static createConfirmation(
    message: string,
    orderId?: string,
  ): WhatsAppFormattedMessage {
    return {
      interactive: {
        type: "button",
        header: {
          type: "text",
          text: "⚠️ Confirmación Requerida",
        },
        body: {
          text: message,
        },
        footer: {
          text: "Selecciona una opción",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: orderId ? `yes_${orderId}` : "yes",
                title: "✅ Sí",
              },
            },
            {
              type: "reply",
              reply: {
                id: orderId ? `no_${orderId}` : "no",
                title: "❌ No",
              },
            },
          ],
        },
      },
    };
  }

  /**
   * Creates a success message
   */
  static createSuccess(
    message: string,
    orderId?: string,
  ): WhatsAppFormattedMessage {
    const successText = `✅ *¡Éxito!*\n\n${message}`;

    if (orderId) {
      return {
        text: `${successText}\n\n🆔 *ID:* ${orderId}`,
      };
    }

    return {
      text: successText,
    };
  }

  /**
   * Creates an error message
   */
  static createError(
    message: string,
    suggestion?: string,
  ): WhatsAppFormattedMessage {
    let errorText = `❌ *Error*\n\n${message}`;

    if (suggestion) {
      errorText += `\n\n💡 *Sugerencia:* ${suggestion}`;
    }

    return {
      text: errorText,
    };
  }
}
