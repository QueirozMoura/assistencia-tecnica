/**
 * Converte uma string em slug URL-friendly.
 * Ex: "Máquina de Lavar" → "maquina-de-lavar"
 */
export function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
