// ─────────────────────────────────────────────────────────────────────────────
// Mapeamento centralizado: slug do produto → imagem(ns) local(is)
//
// Estratégia:
//   1. Busca pelo slug exato do produto.
//   2. Se não encontrar, busca pelo slug da categoria (fallback por categoria).
//   3. Se não encontrar, retorna null → componente exibe placeholder SVG.
//
// Não altera schema Prisma, não move arquivos, não salva URLs no banco.
// ─────────────────────────────────────────────────────────────────────────────

// ── Imports das imagens disponíveis ──────────────────────────────────────────

// Máquinas de Lavar (3 fotos)
import maqLavar1 from '../assets/images/Máquinas de Lavar/WhatsApp Image 2026-05-22 at 23.41.47.jpeg'
import maqLavar2 from '../assets/images/Máquinas de Lavar/WhatsApp Image 2026-05-22 at 23.41.47 (1).jpeg'
import maqLavar3 from '../assets/images/Máquinas de Lavar/WhatsApp Image 2026-05-22 at 23.41.47 (2).jpeg'

// Lava e Seca (2 fotos)
import lavaSeca1 from '../assets/images/Lava e Seca/WhatsApp Image 2026-05-22 at 23.43.31.jpeg'
import lavaSeca2 from '../assets/images/Lava e Seca/WhatsApp Image 2026-05-22 at 23.43.32.jpeg'

// Micro-ondas (4 fotos)
import micro1 from '../assets/images/Microondas/WhatsApp Image 2026-05-22 at 23.46.57.jpeg'
import micro2 from '../assets/images/Microondas/WhatsApp Image 2026-05-22 at 23.46.58.jpeg'
import micro3 from '../assets/images/Microondas/WhatsApp Image 2026-05-22 at 23.46.58 (1).jpeg'
import micro4 from '../assets/images/Microondas/WhatsApp Image 2026-05-22 at 23.46.58 (2).jpeg'

// ── Mapeamento por slug do produto ────────────────────────────────────────────
//
// Estrutura: { [slug]: { primary: img, gallery: [img, img, ...] } }
//
const PRODUCT_IMAGE_MAP = {
  // ── Máquinas de Lavar ──────────────────────────────────────────────────────
  'maquina-lavar-brastemp-11kg-inox': {
    primary: maqLavar1,
    gallery: [maqLavar1, maqLavar2],
  },
  'maquina-lavar-consul-10kg-branca': {
    primary: maqLavar2,
    gallery: [maqLavar2, maqLavar1],
  },

  // ── Lava e Seca ────────────────────────────────────────────────────────────
  'lava-seca-samsung-11kg-inox': {
    primary: lavaSeca1,
    gallery: [lavaSeca1, lavaSeca2],
  },
  'lava-seca-lg-12kg-inox': {
    primary: lavaSeca2,
    gallery: [lavaSeca2, lavaSeca1],
  },

  // ── Micro-ondas ────────────────────────────────────────────────────────────
  'micro-ondas-electrolux-31l-inox': {
    primary: micro1,
    gallery: [micro1, micro2],
  },
  'micro-ondas-panasonic-32l-branco': {
    primary: micro2,
    gallery: [micro2, micro3],
  },

  // ── Centrífugas (sem foto própria — usa melhor visual disponível) ──────────
  'centrifuga-consul-10kg-branca': {
    primary: maqLavar3,
    gallery: [maqLavar3],
  },
  'centrifuga-brastemp-10kg-inox': {
    primary: maqLavar3,
    gallery: [maqLavar3, maqLavar1],
  },
}

// ── Fallback por categoria (slug da categoria do banco) ───────────────────────
const CATEGORY_FALLBACK = {
  'maquinas-de-lavar': { primary: maqLavar1, gallery: [maqLavar1, maqLavar2] },
  'lava-e-seca':       { primary: lavaSeca1, gallery: [lavaSeca1, lavaSeca2] },
  'micro-ondas':       { primary: micro1,    gallery: [micro1, micro2]       },
  'centrifugas':       { primary: maqLavar3, gallery: [maqLavar3]            },
  'pecas-e-acessorios':{ primary: maqLavar1, gallery: [maqLavar1]            },
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Retorna a imagem principal de um produto.
 *
 * Prioridade:
 *   1. URL salva no banco (imagemPrincipal) — quando existir
 *   2. Mapeamento local por slug do produto
 *   3. Fallback por slug da categoria
 *   4. null → componente exibe placeholder
 *
 * @param {Object} produto  — objeto retornado pela API
 * @returns {string|null}
 */
export function getPrimaryImage(produto) {
  if (!produto) return null

  // 1. URL do banco tem prioridade (Fase 2 — quando imagens forem hospedadas)
  if (produto.imagemPrincipal) return produto.imagemPrincipal

  // 2. Mapeamento exato por slug do produto
  const bySlug = PRODUCT_IMAGE_MAP[produto.slug]
  if (bySlug) return bySlug.primary

  // 3. Fallback por categoria
  const catSlug = produto.categoria?.slug
  if (catSlug && CATEGORY_FALLBACK[catSlug]) return CATEGORY_FALLBACK[catSlug].primary

  return null
}

/**
 * Retorna o array de imagens (galeria) de um produto.
 *
 * Prioridade:
 *   1. Array de URLs do banco (imagens[]) — quando existir
 *   2. Galeria do mapeamento local por slug
 *   3. Fallback por categoria (array com 1 imagem)
 *   4. [] → componente exibe placeholder
 *
 * @param {Object} produto  — objeto retornado pela API
 * @returns {string[]}
 */
export function getGallery(produto) {
  if (!produto) return []

  // 1. URLs do banco
  if (produto.imagens?.length > 0) return produto.imagens

  // 2. Galeria local por slug
  const bySlug = PRODUCT_IMAGE_MAP[produto.slug]
  if (bySlug) return bySlug.gallery

  // 3. Fallback por categoria
  const catSlug = produto.categoria?.slug
  if (catSlug && CATEGORY_FALLBACK[catSlug]) return CATEGORY_FALLBACK[catSlug].gallery

  return []
}
