# Plantilla: rebrand de tienda de nicho

Copia todo lo que hay debajo de la segunda línea, cambia los `{{...}}` y pégalo en Claude Code
dentro del proyecto de la web.

| Variable | Ejemplo (VoltBike) |
|---|---|
| `{{NOMBRE}}` | VoltBike |
| `{{PRODUCTO}}` | bicis eléctricas |
| `{{PRODUCTO_EN}}` (para las búsquedas de la skill) | electric bike |
| `{{COLOR_PRIMARIO}}` | verde eléctrico #00E676 |
| `{{COLOR_OSCURO}}` | negro #0A0A0A |
| `{{COLOR_OVERLAY}}` | verde oscuro |
| `{{TONO}}` | moderno, técnico pero accesible |
| `{{TIPOGRAFIA}}` | sans-serif limpia |
| `{{URL_LOCAL}}` | http://localhost:3000 |

## Instalación (una vez, en la terminal o dentro de Claude Code)

```bash
# Design system (UI/UX Pro Max)
npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max
# Documentación al día
npx ctx7 setup --claude
# Navegador para probar la web
claude mcp add playwright npx @playwright/mcp@latest
# Componentes de 21st.dev (pide una API key gratis en 21st.dev/mcp)
npx @21st-dev/cli@latest init --client claude
# Animaciones (Emil Kowalski)
npx skills@latest add emilkowalski/skills
```

Dentro de Claude Code:

```
/plugin marketplace add pbakaus/impeccable
/plugin install impeccable@impeccable
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

Strix va aparte (necesita Docker y una API key de un modelo): https://github.com/usestrix/strix

---

Quiero que transformes esta web en una tienda especializada en {{PRODUCTO}} llamada
"{{NOMBRE}}".

## Cómo trabajar (skills y herramientas)

Si alguna no está instalada, avísame y sigue sin ella; no la instales tú.

**Fase 1 — Contexto**
- `claude-mem`: recupera lo que ya hicimos en este proyecto antes de empezar.
- Detecta el stack del proyecto (no lo supongas).
- `Context7`: consulta la documentación de la versión instalada de cada librería o framework
  que vayas a tocar (mira `package.json`) antes de escribir código.

**Fase 2 — Dirección visual** (`ui-ux-pro-max`)
- Si ya existe `design-system/<slug-de-{{NOMBRE}}>/MASTER.md`, léelo y úsalo. Si no, genéralo:
  `search.py "{{PRODUCTO_EN}} ecommerce store modern" --design-system --persist -p "{{NOMBRE}}" --output-dir "<raíz del proyecto>"`
- Búsquedas puntuales: `"hero overlay text contrast" --domain ux`,
  `"product card ecommerce" --domain landing`, `"footer dark contrast" --domain ux`,
  y la guía del stack detectado con `--stack`.
- **Mis colores y tipografía de abajo mandan** sobre lo que propongan las skills.

**Fase 3 — Construcción**
- `Magic (21st.dev)`: úsalo solo para secciones nuevas (hero, beneficios, FAQ, footer).
  **Nunca** para sustituir las tarjetas de producto, el exit popup ni el botón de Amazon.
  Adapta cada componente a mis tokens de color y tipografía.
- Skills de Emil Kowalski (`emil-design-eng`, `improve-animations`): respuesta al pulsar los
  botones, menús y modales rápidos, y respetar `prefers-reduced-motion`.

**Fase 4 — Revisión**
- `Impeccable`: haz una crítica de diseño (espaciado, tipografía, jerarquía, móvil) y aplica los
  arreglos.
- `Playwright`: abre {{URL_LOCAL}} y prueba como un usuario, a 375px, 768px y 1280px:
  navegación, tarjetas, botón de Amazon (que el enlace sea correcto, sin comprar nada),
  exit popup y que no haya scroll horizontal. Haz capturas de pantalla.
- `web-design-guidelines`: revisa los archivos que cambiaste y corrige lo que marque.

**Fase 5 — Seguridad (opcional, solo en mi propia app)**
- `Strix` contra mi entorno local o de staging, nunca contra producción ni contra webs de
  terceros. Reporta lo que encuentre; no cambies nada sin preguntarme.

## Cambios

1. **Nombre y branding**: cambia el nombre del sitio a "{{NOMBRE}}". Identidad visual moderna
   con paleta principal en {{COLOR_PRIMARIO}} y {{COLOR_OSCURO}}, tipografía {{TIPOGRAFIA}}.
   Aplícalo en header, footer, botones, hero y favicon. Define los colores como variables/tokens,
   no como hex sueltos en los componentes.

2. **Estructura**: esta web solo vende {{PRODUCTO}}, no hay categorías múltiples. Elimina
   cualquier menú de categorías o sección que divida los productos por tipo.

3. **Textos**: actualiza headline, subtítulo y cualquier texto de la web para que hablen
   exclusivamente de {{PRODUCTO}}. Tono: {{TONO}}.

4. **Mantén intactos**: la estructura de tarjetas de producto, el sistema de datos, el exit
   popup de suscriptores y el botón de compra en Amazon.

5. **Hero**: overlay {{COLOR_OVERLAY}} semitransparente (opacidad 15-20%) sobre la imagen de
   fondo para que el texto blanco se lea. Comprueba contraste mínimo 4.5:1; si con 20% no
   llega, dímelo en lugar de subirlo por tu cuenta.

6. **Footer**: fondo oscuro ({{COLOR_OSCURO}} o similar) con texto claro. Nunca texto claro
   sobre fondo claro.

7. **Responsive**: contenedores con padding horizontal y max-width proporcional. Nunca anchos
   fijos que desborden en pantallas algo estrechas. Sin scroll horizontal a 375px.

8. **No añadas** selector de divisas ni selector de idioma.

## Entrega

- Lista de archivos cambiados.
- Capturas de Playwright en los 3 anchos.
- Qué marcaron Impeccable y `web-design-guidelines`, y qué corregiste.
- Recomendaciones de las skills que no apliqué porque chocaban con mis reglas.
- Si pasaste Strix: hallazgos ordenados por gravedad.
