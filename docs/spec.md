# Especificación de Peques

## Producto

PWA instalable, móvil y usable con una mano para consultar y anotar el seguimiento de varios hijos sin cuentas. Conserva el lenguaje visual del proyecto de referencia: gradientes suaves, tarjetas, navegación inferior de siete secciones, formularios en paneles inferiores y gráfica de peso ampliable.

## Privacidad y persistencia

Los datos familiares se almacenan exclusivamente en IndexedDB en el dispositivo. Peques no dispone de backend ni base de datos remota. Ninguna escritura usa HTTP. Los recursos estáticos, incluidos los payloads estáticos del router Next, no contienen información familiar.

Borrar los datos del navegador, eliminar el almacenamiento del sitio o perder el dispositivo puede eliminar la información si no existe una copia exportada. Ni IndexedDB ni el JSON se cifran en esta versión. No hay cuentas, PIN, sesiones, cookies propias, trackers ni telemetría.

## Hijos y aislamiento

Sin hijos se muestra «Añade tu primer hijo». Nombre y fecha de nacimiento son obligatorios; hora, sexo, identificador sanitario y edad gestacional son opcionales. Se usan UUID y timestamps UTC. Crear un hijo genera su plan vacunal según nacimiento y la comunidad familiar seleccionada, sin datos personales de ejemplo. El selector recuerda el último hijo.

Cada peso, planificación, aplicación y descanso lleva `childId`. Los repositorios validan existencia y pertenencia dentro de las transacciones. Un identificador de otro hijo no permite editar ni borrar sus filas. Inicio, Peso, Vacunas, Sueño y Calendario cambian con el hijo activo. Viaje no cambia de contenido.

En Ajustes se pueden añadir, editar y eliminar hijos. El borrado muestra los recuentos, ofrece exportar y exige escribir el nombre exacto. La eliminación de datos asociados y la selección de un hijo restante son atómicas. La lista familiar de Viaje se conserva.

## Seguimiento

Crecimiento mantiene el alta, edición, borrado e histórico del peso en kg, y añade longitud tumbado, estatura de pie y perímetro cefálico. `/peso` ofrece gráficas SVG de peso, talla, IMC, perímetro cefálico y peso para longitud/estatura. El IMC y el peso para longitud/estatura sólo aparecen con peso y talla del mismo día. Las referencias OMS son sexoespecíficas, locales y orientativas: peso para edad hasta 10 años, talla e IMC hasta 19, y perímetro cefálico/peso para talla hasta 5. En prematuridad se usa edad corregida como referencia de crecimiento sin alterar la edad cronológica visible.

Vacunas conserva estados pendiente, próxima, retrasada y aplicada, vistas por estado/edad, edición de fecha y dosis, lugar, lote y notas. Una aplicación puede reabrirse tras confirmación; el plan permanece. Las aplicaciones independientes son editables y borrables. No se inventan reglas médicas nuevas ni fechas de campañas.

Sueño conserva siestas/noches, registro manual, edición del inicio, fin y tipo, historial agrupado y resumen diario. Los cronómetros sobreviven a navegación y reinicio porque se guardan sus timestamps. El atajo es una operación local atómica sobre el hijo activo.

Viaje permite crear/editar/borrar categorías y ubicaciones jerárquicas, crear/editar/marcar/borrar elementos y reiniciar marcas. Los órdenes por preparación y ubicación son independientes. No se borran categorías ni ubicaciones todavía referenciadas. Las ubicaciones no pueden formar ciclos.

Calendario tiene agenda y mes, eventos derivados de pesos, vacunas con fecha y sueño. «Todos los hijos» identifica cada evento y selecciona su hijo al abrir la sección de origen. Consulta añade una próxima cita, preguntas para pediatría y un informe imprimible local. No se utiliza un calendario remoto.

## Copias y PWA

Exportación explícita de todas las tablas, incluyendo medidas de crecimiento, configuración, ubicaciones y cronómetros activos. Importación con comprobación de formato, versión, tipos, UUID, unicidad, relaciones y ausencia de huérfanos; las copias v1 se convierten sin medidas nuevas. Resumen previo y confirmación fuerte. Sustitución en una sola transacción con rollback. Límite de 25 MiB para archivos de copia.

La primera visita a cada pantalla principal muestra un tutorial breve y local de tres pasos, con resaltado del control explicado, alternativa contextual cuando no hay datos y opción para posponerlo o saltarlo completo. El progreso forma parte de `settings`; Ajustes permite relanzar el recorrido guiado completo desde Inicio, sin usar localStorage ni red. La aplicación recuerda la copia pendiente cuando no existe una exportación o han pasado más de 14 días desde la última.

Serwist precachea únicamente archivos compilados de esta versión. La primera carga e instalación de esos archivos requiere conexión. Una vez preparado, abrir, consultar, añadir, editar y borrar no requiere red. La actualización de la aplicación no borra la base familiar y la recarga para aplicar una versión nueva es explícita.
