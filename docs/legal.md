# Páginas legales: pendientes antes de lanzar

Nota interna (no se publica en la web).

- **Revisión por un abogado.** `/aviso-de-privacidad` y `/como-ganamos-dinero` son un borrador redactado sin asesoría
  legal. Antes de captar el primer email, que un abogado en protección de datos revise el aviso contra la LFPDPPP
  vigente (la ley nueva publicada en el DOF el 20/03/2025 y sus lineamientos): elementos obligatorios, plazos de
  respuesta ARCO (puse 20 + 15 días hábiles), autoridad garante y si hace falta aviso simplificado junto al formulario
  de alertas.
- **Placeholders a llenar** en `src/pages/aviso-de-privacidad.astro`: `[NOMBRE DEL RESPONSABLE]`, `[DOMICILIO]`,
  `[EMAIL DE CONTACTO]`. En `public/robots.txt`: `[DOMINIO]`.
- **Mantenerlo al día.** Si entra un servicio nuevo que trate datos personales (otro encargado, cookies, analítica
  distinta), actualizar el aviso y su fecha (`updated`) antes de desplegarlo.
- **Encargados**: confirmar la región de Supabase al crear el proyecto; el aviso dice que los servidores pueden estar
  fuera de México.
