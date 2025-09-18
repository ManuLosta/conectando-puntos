# WhatsApp Message Formatting Examples

## 📋 **Message Format Types**

### **1. ORDER SUMMARY (Interactive with Buttons)**

```json
{
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "🧾 Resumen del Pedido"
    },
    "body": {
      "text": "🧾 *Pedido para Supermercado Don Pepe*\n\n📦 *PRODUCTOS SOLICITADOS:*\n1. 10× *Queso La Serenísima* (QLS001)\n   ✅ Stock: 50 • $25.00\n\n💡 *RECOMENDACIONES ADICIONALES:*\n1. *Yogur La Serenísima* (YLS002)\n   💰 $8.50 • Producto habitual del cliente\n\n💰 *Total estimado:* $258.50\n🆔 *ID del pedido:* ORD123456"
    },
    "footer": {
      "text": "¿Deseas confirmar este pedido?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "confirm_order_ORD123456",
            "title": "✅ Confirmar"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "modify_order_ORD123456",
            "title": "✏️ Modificar"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "cancel_order_ORD123456",
            "title": "❌ Cancelar"
          }
        }
      ]
    }
  }
}
```

### **2. PRODUCT SUGGESTIONS (Interactive List)**

```json
{
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "🎯 Productos Recomendados"
    },
    "body": {
      "text": "💡 *Sugerencias para Supermercado Don Pepe*\n\n*1.* *Queso La Serenísima* 🏷️ *15% OFF*\n   📦 SKU: QLS001\n   💰 $21.25\n   📊 Producto habitual del cliente\n\n*2.* *Leche La Serenísima*\n   📦 SKU: LLS002\n   💰 $12.50\n   📊 Expira en 5 días\n\n*3.* *Yogur Activia*\n   📦 SKU: YAC003\n   💰 $8.75\n   📊 Muy popular entre otros clientes"
    },
    "footer": {
      "text": "Selecciona productos para agregar"
    },
    "action": {
      "button": "Ver Productos",
      "sections": [
        {
          "title": "Productos Sugeridos",
          "rows": [
            {
              "id": "add_product_QLS001",
              "title": "Queso La Serenísima",
              "description": "$21.25 • Producto habitual del cliente"
            },
            {
              "id": "add_product_LLS002",
              "title": "Leche La Serenísima",
              "description": "$12.50 • Expira en 5 días"
            },
            {
              "id": "add_product_YAC003",
              "title": "Yogur Activia",
              "description": "$8.75 • Muy popular entre otros clientes"
            }
          ]
        }
      ]
    }
  }
}
```

### **3. CLIENT SEARCH RESULTS (Interactive List)**

```json
{
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "🔍 Resultados de Búsqueda"
    },
    "body": {
      "text": "Encontré *3 clientes* similares:\n\nSelecciona el cliente correcto:"
    },
    "footer": {
      "text": "Toca para seleccionar cliente"
    },
    "action": {
      "button": "Seleccionar Cliente",
      "sections": [
        {
          "title": "Clientes Encontrados",
          "rows": [
            {
              "id": "select_client_CLI001",
              "title": "Supermercado Don Pepe",
              "description": "📱 +54911234567"
            },
            {
              "id": "select_client_CLI002",
              "title": "Supermercado Don Pedro",
              "description": "📱 +54911234568"
            },
            {
              "id": "select_client_CLI003",
              "title": "Supermercado Don Pablo",
              "description": "Sin teléfono"
            }
          ]
        }
      ]
    }
  }
}
```

### **4. CONFIRMATION MESSAGES (Interactive Buttons)**

```json
{
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "⚠️ Confirmación Requerida"
    },
    "body": {
      "text": "¿Estás seguro de que quieres confirmar el pedido ORD123456 por un total de $258.50?"
    },
    "footer": {
      "text": "Selecciona una opción"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "yes_ORD123456",
            "title": "✅ Sí"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "no_ORD123456",
            "title": "❌ No"
          }
        }
      ]
    }
  }
}
```

### **5. FORMATTED TEXT MESSAGES**

```json
{
  "text": "📦 *ESTADO DEL STOCK*\n\n✅ *Queso La Serenísima*\n   📦 SKU: QLS001\n   🛒 Solicitado: 10\n   📊 Stock: 50 (Disponible)\n   💰 $25.00\n\n⚠️ *Leche Entera*\n   📦 SKU: LEN002\n   🛒 Solicitado: 20\n   📊 Stock: 15 (Solo 15 disponibles)\n   💰 $12.50"
}
```

## 🎯 **Key Benefits**

### **✅ BEFORE (Plain Text)**

```
Pedido para Supermercado Don Pepe
- 10 x Queso La Serenisima (QLS001) — stock: 50
Te recomiendo también: 3 productos (ej.: YLS002 Yogur La Serenisima x 5 — $8.50 - producto habitual)
Total estimado: $258.50
Orden borrador: ORD123456
¿Querés confirmarlo? (sí/no)
```

### **✅ AFTER (Structured Interactive)**

- **Visual hierarchy** with headers and sections
- **Bold text** for important information
- **Action buttons** for yes/no confirmations
- **Interactive lists** for product selection
- **Discount highlighting** with 🏷️ icons
- **Emoji strategically placed** for better scanning
- **Proper spacing** and formatting for mobile

## 📱 **Mobile Experience Improvements**

1. **Easier to scan** - Visual hierarchy with headers
2. **Faster interactions** - One-tap buttons vs typing
3. **Less errors** - Structured selections vs free text
4. **Professional appearance** - Consistent formatting
5. **Better engagement** - Interactive elements encourage action

## 🔧 **Implementation Notes**

- All confirmations use **action buttons** (no free text)
- Product selections use **interactive lists**
- Text formatting follows **WhatsApp standards**
- Messages stay under **4,096 characters**
- Headers limited to **60 characters**
- Footers limited to **60 characters**
