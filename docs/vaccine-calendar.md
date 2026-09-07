# Plan vacunal de referencia

Peques permite seleccionar una comunidad familiar: Comunidad de Madrid o Castilla-La Mancha. El calendario activo es orientativo y se muestra con su fuente y fecha de verificación; no sustituye la confirmación del centro de salud.

Peques reutiliza las definiciones de Madrid 2026 documentadas por el proyecto Irati. No consulta una API médica ni actualiza reglas silenciosamente. La fecha de verificación heredada de esas definiciones es **18 de julio de 2026**; no se presenta como una nueva revisión clínica realizada por Peques.

Fuentes documentadas:

- [Calendario de vacunación/inmunización a lo largo de toda la vida 2026, Comunidad de Madrid](https://www.comunidad.madrid/publicacion/ref/51768).
- [Documento técnico de la Comunidad de Madrid](https://www.comunidad.madrid/publicacion/ref/51747).
- [Calendario de vacunaciones de Castilla-La Mancha](https://sanidad.castillalamancha.es/ciudadanos/vacunacion/calendario-vacunaciones).
- [Documento técnico de Castilla-La Mancha](https://sanidad.castillalamancha.es/sites/sescam.castillalamancha.es/files/documentos/pdf/20260107/20251230_documento_tecnico_calendario_sistematico_2026.pdf).

Al crear un hijo se generan 22 dosis independientes, cada una con su propio UUID y `childId`. Las edades se convierten en fechas a partir del nacimiento, ajustando al último día del mes cuando hace falta. No se comparten filas entre hermanos. Castilla-La Mancha usa MenACWY a los 4 meses donde el plan de Madrid conserva MenC.

La inmunización frente a VRS queda con fecha nula y campaña por confirmar: no se arrastra una fecha que correspondía a una persona concreta. Gripe conserva la referencia inicial desde los seis meses y el aviso de confirmar campaña. La familia debe comprobar indicación y fecha con su centro de salud. No se deducen campañas anuales futuras ni se añaden nuevas reglas médicas.

Una dosis sin fecha no se marca como retrasada ni genera un evento con fecha inventada. Para las dosis fechadas se conservan las reglas del dominio: retrasada antes de hoy, próxima en los siguientes 14 días, pendiente después y aplicada cuando existe registro asociado. El día civil se calcula en Europe/Madrid.

Editar el nacimiento no reprograma citas ya guardadas. Se muestra un aviso para revisarlas manualmente. Cambiar la comunidad requiere confirmación: conserva aplicaciones y planes históricos vinculados, sustituye las dosis pendientes y genera el nuevo plan. Editar la planificación no reescribe una aplicación histórica. Fecha real, vacuna, dosis, lugar, lote y notas se conservan en la aplicación. Reabrir elimina esa aplicación tras confirmar y conserva el plan.

Se permiten registros aplicados fuera de la planificación. Este calendario es una ayuda de organización, no un diagnóstico, una prescripción ni una garantía de vigencia para cualquier territorio o situación clínica.
