/**
 * POST /api/upload/produto
 *
 * Recebe um arquivo via multipart/form-data (campo "imagem").
 * Salva em backend/uploads/produtos/<uuid>.<ext>
 * Retorna a URL pública para uso no campo imagemPrincipal do produto.
 *
 * Estrutura preparada para futura migração para cloud (S3/Cloudinary):
 * basta substituir a lógica deste controller — o restante do sistema não muda.
 */
export async function uploadImagemProduto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado. Use o campo 'imagem'.",
      });
    }

    const imagePath = `/uploads/produtos/${encodeURIComponent(req.file.filename)}`;

    // Em produção, prioriza URL pública explícita do backend (evita host interno/proxy)
    const publicApiUrl = process.env.PUBLIC_API_URL?.trim();
    let baseUrl = "";

    if (publicApiUrl) {
      baseUrl = publicApiUrl.replace(/\/+$/, "");
    } else {
      const protocol = req.get("x-forwarded-proto") || req.protocol;
      const host = req.get("x-forwarded-host") || req.get("host");
      baseUrl = `${protocol}://${host}`;
    }

    const url = `${baseUrl}${imagePath}`;

    return res.status(201).json({
      success: true,
      data: {
        url,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
}
