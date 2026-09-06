# Esquema local de Peques

Dexie abre exclusivamente `peques-local`, versión 1. No se importan bases de otras aplicaciones. Las próximas modificaciones de esquema usarán nuevas versiones y migraciones Dexie transaccionales; no se borra la base para actualizarla.

| Tabla                     | Clave       | Índices y relaciones                                                  |
| ------------------------- | ----------- | --------------------------------------------------------------------- |
| children                  | UUID `id`   | `createdAt`                                                           |
| weightEntries             | UUID `id`   | `childId`, `[childId+measuredOn]`                                     |
| plannedVaccineDoses       | UUID `id`   | `childId`, `[childId+plannedDate]`                                    |
| appliedVaccineDoses       | UUID `id`   | `childId`, `[childId+appliedOn]`, `plannedDoseId` único cuando existe |
| sleepEntries              | UUID `id`   | `childId`, `[childId+startedAt]`                                      |
| travelChecklistCategories | UUID `slug` | `sortOrder`                                                           |
| travelChecklistItems      | UUID `id`   | `category`, `storageLocationId`, órdenes por categoría y ubicación    |
| travelStorageLocations    | UUID `id`   | `parentId`, `sortOrder`                                               |
| settings                  | `main`      | Configuración local e hijo seleccionado                               |

`slug` conserva el nombre del campo usado por los componentes de Viaje; su valor es un UUID, independiente del nombre editable de la categoría.

## Hijos

`Child`: `id`, `name`, `birthDate`, `birthTime?`, `sex?`, `healthId?`, `createdAt`, `updatedAt`. Fecha civil ISO, hora opcional HH:mm y timestamps UTC. La zona de presentación heredada es Europe/Madrid. Sexo omitido equivale a `unspecified`.

Crear un hijo genera su planificación vacunal y lo selecciona dentro de una transacción. Editar el nacimiento conserva la planificación ya guardada. Eliminar requiere confirmar su nombre y borra en cascada pesos, planificación, aplicaciones y sueño; mantiene Viaje. Si se elimina el seleccionado, se selecciona el siguiente por fecha de creación o ninguno.

## Datos de seguimiento

Todas las filas específicas incluyen `childId`. Peso conserva `measuredOn`, `weightGrams`, `place` y `notes`. Vacunas conserva nombres, dosis, fechas, lugar, lote y notas. `plannedDate` puede ser nulo para campañas que necesitan confirmar fecha; esas filas no aparecen como retrasadas. Sueño conserva `kind`, `startedAt`, `endedAt`, `createdAt` y `updatedAt`; fin nulo significa cronómetro activo.

IndexedDB no garantiza claves foráneas: los adaptadores comprueban existencia y pertenencia dentro de cada transacción de escritura. Una aplicación vinculada debe pertenecer al mismo hijo que la dosis. Solo puede existir un sueño activo por hijo, también entre pestañas.

## Configuración y privacidad

`settings` contiene `activeChildId`, `lastExportedAt`, `travelView`, `vaccineView` y `calendarAllChildren`. No contiene sesiones, colas ni estado remoto.

No se guardan datos familiares en Cache Storage ni en localStorage. La copia JSON exportada es una salida explícita que controla el usuario.
