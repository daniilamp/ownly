# 📧 Email de Notificación a Clientes

---

## Asunto: [IMPORTANTE] Actualización de Seguridad - Ownly API v2.0

---

Hola [NOMBRE_CLIENTE],

Nos complace anunciarte que **Ownly API v2.0** ya está disponible con mejoras significativas en seguridad y control de acceso.

---

## 🔐 ¿Qué ha cambiado?

A partir del **1 de mayo de 2026**, todos los endpoints de la API de Ownly requerirán **autenticación con API Key**.

### Antes (v1.0)
```bash
GET /api/identity/{ownly_id}
# Sin autenticación ❌
```

### Ahora (v2.0)
```bash
GET /api/identity/{ownly_id}
Authorization: Bearer {TU_API_KEY} ✅
```

---

## ✨ Nuevas Características

✅ **Seguridad mejorada**: Todos los endpoints protegidos con API keys  
✅ **Sin exposición de datos**: No se expone PII ni JSON en respuestas públicas  
✅ **Búsqueda flexible**: Soporta búsqueda por Ownly ID o email  
✅ **Anti multicuenta**: Endpoint dedicado para detectar usuarios únicos  
✅ **Rate limiting**: Control de uso y protección contra abuso  

---

## 🚀 ¿Qué necesitas hacer?

### 1. Obtener tu API Key

Responde a este email con:
- **Nombre de tu empresa**
- **Caso de uso** (prop firm, broker, exchange, etc.)
- **Volumen estimado** de peticiones/día

Te enviaremos tu API key en **24-48 horas**.

### 2. Actualizar tu integración

Una vez recibas tu API key, añade el header de autenticación:

**Node.js**:
```javascript
const response = await fetch(
  'https://ownly-api.onrender.com/api/identity/ow_8F3K29X',
  {
    headers: {
      'Authorization': 'Bearer TU_API_KEY'
    }
  }
);
```

**Python**:
```python
response = requests.get(
    'https://ownly-api.onrender.com/api/identity/ow_8F3K29X',
    headers={'Authorization': 'Bearer TU_API_KEY'}
)
```

**cURL**:
```bash
curl -X GET "https://ownly-api.onrender.com/api/identity/ow_8F3K29X" \
  -H "Authorization: Bearer TU_API_KEY"
```

### 3. Probar en staging

Antes de desplegar a producción, prueba tu integración en nuestro entorno de staging.

---

## 📅 Timeline

| Fecha | Evento |
|-------|--------|
| **27 Abril 2026** | Lanzamiento v2.0 (retrocompatible) |
| **1 Mayo 2026** | API keys obligatorias |
| **15 Mayo 2026** | v1.0 deprecada (sin autenticación) |
| **1 Junio 2026** | v1.0 desactivada completamente |

⚠️ **Tienes hasta el 1 de mayo para migrar**. Después de esa fecha, las peticiones sin API key serán rechazadas.

---

## 📚 Documentación

Hemos preparado documentación completa para facilitar tu migración:

🔗 **API Reference**: [Adjunto: CLIENT_API_DOCUMENTATION.md]  
🔗 **Guía de Migración**: https://docs.ownly.io/migration-v2  
🔗 **Ejemplos de código**: https://github.com/ownly/api-examples  

---

## 💼 Beneficios para tu Negocio

### Para Prop Firms
- ✅ Verifica traders antes de asignar capital
- ✅ Detecta multicuentas automáticamente
- ✅ Reduce fraude y riesgo operacional

### Para Brokers
- ✅ Onboarding instantáneo (usuarios ya verificados)
- ✅ Reduce costos de KYC duplicado
- ✅ Mejora experiencia de usuario

### Para Exchanges
- ✅ Cumplimiento regulatorio simplificado
- ✅ KYC reutilizable entre plataformas
- ✅ Reduce tiempo de activación de cuentas

---

## 🔒 Seguridad de tu API Key

⚠️ **IMPORTANTE**: Tu API key es como una contraseña. Sigue estas buenas prácticas:

✅ Guárdala en variables de entorno (no en código)  
✅ Usa HTTPS para todas las peticiones  
✅ No la compartas públicamente  
✅ No la incluyas en código frontend  
✅ Rótala periódicamente (cada 90 días)  

---

## 🆘 ¿Necesitas Ayuda?

Nuestro equipo está aquí para ayudarte con la migración:

📧 **Email**: support@ownly.io  
💬 **Chat**: https://ownly.io/support  
📞 **Teléfono**: +34 XXX XXX XXX  
📅 **Agendar llamada**: https://calendly.com/ownly-support  

---

## 🎁 Oferta Especial

**Migra antes del 1 de mayo** y obtén:

🎉 **3 meses gratis** de plan Pro (10,000 peticiones/día)  
🎉 **Soporte prioritario** durante la migración  
🎉 **Acceso anticipado** a nuevas funcionalidades  

---

## ❓ FAQ

**P: ¿Cuánto cuesta la API?**  
R: Plan gratuito: 1,000 peticiones/día. Planes Pro disponibles desde €99/mes.

**P: ¿Puedo seguir usando v1.0?**  
R: Sí, hasta el 1 de junio de 2026. Después será desactivada.

**P: ¿Cómo obtengo mi API key?**  
R: Responde a este email con tu información y te la enviaremos en 24-48h.

**P: ¿Qué pasa si no migro a tiempo?**  
R: Tus peticiones serán rechazadas con error 401 (Unauthorized).

**P: ¿Puedo tener múltiples API keys?**  
R: Sí, puedes tener diferentes keys para staging/producción.

---

Gracias por confiar en Ownly. Estamos comprometidos en ofrecerte la mejor infraestructura de verificación de identidad para tu negocio.

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,

**El equipo de Ownly**  
support@ownly.io  
https://ownly.io

---

P.D. Responde a este email para solicitar tu API key y comenzar la migración hoy mismo.

---

## 📎 Adjuntos
- CLIENT_API_DOCUMENTATION.md (Documentación completa de la API)
- MIGRATION_GUIDE.md (Guía paso a paso de migración)
- CODE_EXAMPLES.zip (Ejemplos en Node.js, Python, PHP, Java)
