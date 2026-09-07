# Copias locales

La copia es un JSON sin cifrar con `format: "peques-backup"`, `schemaVersion: 3`, `exportedAt` en UTC y `data` con todas las tablas documentadas en el esquema. Incluye los hijos, pesos, medidas de crecimiento, la fecha de primer uso, la selección activa, cronómetros en curso, categorías, ubicaciones y ambos órdenes de Viaje. Las copias v1 y v2 se pueden importar; las antiguas sin fecha de primer uso usan su fecha de exportación como referencia.

La lectura se hace en una transacción consistente. La restauración sustituye todos los datos locales; no combina copias de distintos dispositivos. El archivo se valida antes de mostrar el resumen y de nuevo antes de comenzar la transacción de escritura. Se comprueban campos, tipos, fechas, UUID, duplicados, relaciones, pertenencia de aplicaciones de vacunas y unicidad de cronómetros por hijo. Se rechazan versiones futuras, campos desconocidos y ubicaciones cíclicas.

La interfaz debe mostrar el resumen de la copia, advertir de la sustitución, ofrecer exportar el estado actual y pedir confirmación antes de restaurar. La aplicación concede 7 días iniciales sin aviso; después muestra un recordatorio si nunca se ha preparado una copia o si han pasado más de 14 días desde la última. Si una escritura falla, la transacción revierte también el vaciado inicial. Una copia inválida nunca modifica la base.

El límite de importación es 25 MiB para evitar agotar la memoria del navegador móvil. El archivo contiene información personal: guárdalo en un lugar que controles. Peques no lo sube a ningún servicio ni lo envía por red.

Exportar requiere una acción explícita. El navegador entrega una descarga, pero la aplicación no puede comprobar dónde se guarda ni garantizar que el usuario la conserve.
