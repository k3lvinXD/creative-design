# Creative Design

Catálogo estático en español, con precios en córdobas de Nicaragua (C$), carrito y compra por WhatsApp al +505 8903 9913. Incluye Instagram y TikTok @creaty.design_.

## Abrir

Abre `dist/index.html` en tu navegador. No necesita instalar paquetes.

## Editar productos sin programar

1. Pulsa **Preparar mi catálogo** al pie de la página.
2. Selecciona un espacio y escribe nombre, precio, categoría y foto.
3. Marca **Mostrar en más vendidos** para destacarlo. Desmarca **Es un producto de ejemplo** al introducir un producto real.
4. Guarda cada ficha. El borrador solo se guarda en ese navegador; no es un panel de administración conectado a un servidor.
5. Pulsa **Descargar página actualizada**. Renombra el archivo descargado a `index.html` y reemplaza `dist/index.html` en GitHub.
6. Publica el cambio en GitHub. Si Render está conectado con despliegue automático, actualizará el sitio.

Las fotos se incluyen dentro del HTML. Guarda la descarga como copia de seguridad. Los visitantes no pueden cambiar el catálogo publicado desde el editor: sus cambios solo afectan a su navegador. Para una administración central con inicio de sesión se necesitaría una base de datos y un backend.

También puedes editar directamente el JSON de `catalog-data` dentro de `dist/index.html`. `best` controla los destacados; son seleccionados manualmente, no estadísticas de ventas. Los espacios sin nombre no se pueden comprar. El precio C$ 150.00 es únicamente un ejemplo.

## Subir a GitHub

En tu cuenta crea un repositorio llamado `creative-design` y sube el contenido de esta carpeta, conservando `dist/index.html`, `render.yaml` y este README en sus ubicaciones.

## Publicar en Render

En Render selecciona **New > Static Site**, conecta el repositorio y configura:

- Build Command: `echo Sitio listo`
- Publish Directory: `dist`

También puedes usar un Blueprint con el archivo `render.yaml` incluido. Documentación: https://render.com/docs/static-sites y https://render.com/docs/blueprint-spec

## Pedidos

**Comprar ya** abre WhatsApp para un artículo. El carrito permite cambiar cantidades y eliminar productos. **Pedir por WhatsApp** prepara un mensaje con nombres, cantidades, precios, subtotal y enlaces a cada ficha. El cliente revisa y envía el mensaje desde WhatsApp; no se envía automáticamente. Disponibilidad, envío y pago se confirman en el chat.

Los enlaces se adaptan al dominio donde publiques la página. Para compartir fichas con clientes, usa el sitio publicado, no un archivo abierto desde tu equipo. WhatsApp recibe enlaces, no adjunta automáticamente las fotos.

## Verificación

Se comprobó la sintaxis de JavaScript y se probaron cantidades, subtotales, filtros, búsqueda, fichas directas y composición de enlaces de WhatsApp. La vista previa visual no pudo completarse por restricciones de conexión del entorno de creación.