import { SITE } from '../config';
import { formatoFecha, formatoPrecio } from './formato';

// Alertas de precio: a quién avisar y qué decirle. Los emails enlazan solo a la web, nunca a Mercado Libre (CLAUDE.md §1).

export type Alerta = {
  id: number;
  email: string;
  scooter_slug: string;
  precio_objetivo: number | null;
  ultimo_aviso_mxn: number | null;
};
export type PrecioCapturado = { precio_mxn: number; disponible: boolean; verificado_en: string };
export type Email = { para: string; asunto: string; texto: string; html: string };

/**
 * Precio por el que hay que avisar a esta alerta, o null.
 * Con objetivo: el precio actual está en o bajo el objetivo. Sin objetivo: bajó respecto a la captura anterior.
 * Nunca dos avisos por el mismo precio, ni por un modelo agotado.
 */
export function precioParaAvisar(a: Alerta, actual?: PrecioCapturado, anterior?: PrecioCapturado): number | null {
  if (!actual?.disponible || actual.precio_mxn === a.ultimo_aviso_mxn) return null;
  const p = actual.precio_mxn;
  if (a.precio_objetivo != null) return p <= a.precio_objetivo ? p : null;
  return anterior && p < anterior.precio_mxn ? p : null;
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

type Enlaces = { origen: string; slug: string; token: string };
const fichaUrl = ({ origen, slug }: Enlaces) => `${origen}/scooter/${encodeURIComponent(slug)}`;
const bajaUrl = ({ origen, token }: Enlaces) => `${origen}/api/alertas/baja?t=${encodeURIComponent(token)}`;

function armar(para: string, asunto: string, parrafos: string[], boton: { texto: string; url: string }, baja: string): Email {
  const texto = [...parrafos, `${boton.texto}: ${boton.url}`, '', `Darte de baja en un clic: ${baja}`, '', SITE.name].join('\n\n');
  const html = `<!doctype html><html lang="es-MX"><body style="font-family:Arial,sans-serif;color:#111;background:#f2efe9;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border:2px solid #111;padding:24px">
<p style="font-weight:bold;letter-spacing:.1em;text-transform:uppercase;font-size:12px">${escapar(SITE.name)}</p>
${parrafos.map((p) => `<p style="font-size:16px;line-height:1.5">${escapar(p)}</p>`).join('\n')}
<p><a href="${escapar(boton.url)}" style="display:inline-block;background:#111;color:#f2efe9;padding:14px 24px;font-weight:bold;text-decoration:none;text-transform:uppercase">${escapar(boton.texto)}</a></p>
<p style="font-size:13px;color:#4a463f">¿Ya no quieres estos correos? <a href="${escapar(baja)}" style="color:#111">Darte de baja en un clic</a>.</p>
</div></body></html>`;
  return { para, asunto, texto, html };
}

/** Email de doble opt-in. El enlace de confirmar lleva el mismo token que el de baja. */
export function emailConfirmacion(para: string, nombre: string, objetivo: number | null, e: Enlaces): Email {
  const confirmar = `${e.origen}/api/alertas/confirmar?t=${encodeURIComponent(e.token)}`;
  const cuando = objetivo != null ? `cuando baje a ${formatoPrecio(objetivo)} o menos` : 'cada vez que baje de precio';
  return armar(
    para,
    `Confirma tu alerta de precio: ${nombre}`,
    [
      `Pediste que te avisemos ${cuando} el ${nombre}.`,
      'Confirma con el botón. Si no fuiste tú, ignora este correo: sin confirmar no te escribiremos más.',
    ],
    { texto: 'Confirmar alerta', url: confirmar },
    bajaUrl(e),
  );
}

/** Aviso de precio. El enlace va a la ficha en la web, donde está el botón de compra. */
export function emailAviso(para: string, nombre: string, precio: PrecioCapturado, e: Enlaces): Email {
  const cuanto = formatoPrecio(precio.precio_mxn);
  return armar(
    para,
    `${nombre} bajó a ${cuanto}`,
    [
      `El ${nombre} está en ${cuanto} (precio verificado el ${formatoFecha(precio.verificado_en)}).`,
      'Los precios cambian rápido: revísalo en la ficha antes de comprar.',
    ],
    { texto: 'Ver la ficha', url: fichaUrl(e) },
    bajaUrl(e),
  );
}
