# Creative Design

Catálogo de Creative Design con precios C$, fotos, carrito y WhatsApp +505 8903 9913. Instagram y TikTok: @creaty.design_.

## Probar en Visual Studio Code

Abre esta carpeta. Con Node.js 22 o superior instalado, ejecuta en la terminal:

```sh
npm start
```

Abre http://localhost:3000. Para probar localmente no necesitas instalar dependencias ni una base de datos: las estadísticas de prueba se guardan en `data/interests.json`. Se conservan al reiniciar. Esta carpeta no se sube a GitHub. La base de producción es independiente.

También puedes abrir `dist/index.html` directamente, pero el ranking compartido y la lectura de algunas fotos para compartir requieren el servidor local o HTTPS.

## Editar desde Visual Studio Code

Los cambios se realizan en la carpeta `C:\Users\KIMC\Desktop\creative-design`, que es tu copia de trabajo. GitHub es una copia remota: actualizar GitHub no modifica automáticamente una carpeta descargada como ZIP. En este chat editaremos también la copia del Escritorio cuando tengamos acceso.

- `dist/productos.js`: nombres, precios, categorías, fotos y `example`.
- `dist/logo.svg`: logo de rompecabezas adaptado de la referencia, sin deformaciones ni sombras.
- `dist/styles.css`: colores, tamaños y distribución.
- `dist/app.js`: carrito, WhatsApp y ranking.
- `dist/index.html`: inicio.
- `dist/catalogo.html`: todos los productos.
- `dist/mas-vendidos.html`: ranking.
- `dist/personalizados.html`: pedidos personalizados.
- Las categorías tienen sus propias páginas: `llaveros.html`, `figuras.html`, `impresiones-3d.html`, `papeleria.html` y `broches.html`.

Para una foto, crea `dist/imagenes/llavero.jpg` y escribe `"image": "imagenes/llavero.jpg"` en el producto de `productos.js`. Cambia `price` por un número, por ejemplo `150`. Conserva cada `id` para no perder estadísticas. Desmarca el ejemplo con `"example": false` cuando sea un producto real.

Ya no hay editor público ni borradores del catálogo en el navegador. Guarda con Ctrl+S y actualiza la página con F5. Todas las páginas comparten el mismo archivo de productos y el carrito. El símbolo SVG conserva el motivo y los colores de la referencia; para usar el logo original exacto puedes sustituirlo por tu archivo de marca y cambiar `src="logo.svg"` en las páginas.

## Más vendidos automático

El título es **Más vendidos**. Su métrica es popularidad según solicitudes, no ventas verificadas. Al pulsar el botón final **Pedir por WhatsApp** se registra una solicitud por cada producto del pedido. Se registra antes de que el cliente envíe el mensaje: cerrar WhatsApp no revierte el clic. Agregar al carrito o abrir la ficha no cuenta. Las cantidades no multiplican la popularidad.

Se admite una solicitud por producto, navegador y día (zona America/Managua), con una cookie anónima firmada. Otro navegador o eliminar las cookies puede contar otra vez; esto reduce duplicados casuales, no es un sistema antifraude. No se guardan nombres, teléfonos ni conversaciones. PostgreSQL aplica la deduplicación de manera atómica. El ranking se actualiza después del clic y cada 30 segundos en otras sesiones.

Sin conexión con la API se muestra “Estadísticas disponibles al conectar el servidor”; no se inventan cifras ni se sustituyen por estadísticas privadas del navegador.

## Foto en WhatsApp

Comprar ya y el carrito abren un resumen con dos opciones:

- **Compartir foto del producto**: en dispositivos compatibles abre el menú del sistema. El cliente elige WhatsApp y el contacto de la tienda; la página no puede seleccionar automáticamente ese destinatario. La app de destino puede omitir el texto junto a los archivos.
- **Pedir por WhatsApp**: abre el chat exacto de la tienda con nombres, cantidades, precios y enlaces públicos. Este es el botón que cuenta para el ranking.

Si el navegador no permite compartir archivos, se ofrece descargar cada foto para adjuntarla manualmente. Usa imágenes PNG, JPG o WebP del mismo sitio, o las cargadas en el editor. Imágenes remotas pueden bloquear su descarga por CORS. Nunca se envían rutas `file:///` ni enlaces localhost: en pruebas locales se incluye solo la referencia del producto. Los enlaces públicos funcionan después de publicar la página. Una página estática no garantiza una vista previa con foto para cada enlace; el botón de compartir archivos es la opción para enviar la imagen real.

## Publicar en Render con ranking compartido

Esta versión necesita un **Web Service**, no un Static Site. Si ya tenías un Static Site, crea un Web Service nuevo para este repositorio. El nombre del blueprint es `creative-design-app` para diferenciarlo del sitio estático anterior.

Configuración:

- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- `NODE_ENV`: `production`
- `COOKIE_SECRET`: un secreto aleatorio; el blueprint lo genera automáticamente.
- `DATABASE_URL`: conexión PostgreSQL de tu proveedor, configurada solo en las variables privadas de Render. No la pongas en el código ni en GitHub. Respeta la configuración TLS de tu proveedor.

El archivo `render.yaml` prepara el servicio y solicita `DATABASE_URL`. No crea ni contrata una base de datos. Crea o conecta PostgreSQL según el plan que prefieras. El servidor crea sus tablas al recibir la primera consulta. Sin `DATABASE_URL`, el catálogo funciona pero las estadísticas responden como no disponibles. Los clics ocurridos sin base conectada no se almacenan ni se recuperan después.

Referencias: https://render.com/docs/deploy-node-express-app y https://node-postgres.com/features/connecting

## Pruebas

```sh
npm test
```

Pruebas de persistencia local, concurrencia, deduplicación, exclusión de ejemplos, orden del ranking, importes y enlaces. La conexión PostgreSQL real y la entrega de imágenes a WhatsApp deben verificarse tras conectar el servicio y desde un dispositivo compatible.