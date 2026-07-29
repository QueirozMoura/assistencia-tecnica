import { unlink } from "fs/promises";
import { uploadImagemProdutoCloudinary } from "../services/cloudinary-upload.service.js";

/**
 * POST /api/upload/produto
 *
 * Recebe um arquivo via multipart/form-data (campo "imagem") usando Multer.
 * Envia a imagem para o Cloudinary e retorna a URL pública para uso em imagemPrincipal.
 * Remove o arquivo temporário local após o processamento (sucesso/erro).
 */
export async function uploadImagemProduto(req, res, next) {
  const arquivoTemporario = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado. Use o campo 'imagem'.",
      });
    }

    const upload = await uploadImagemProdutoCloudinary(req.file.path);

    return res.status(201).json({
      success: true,
      data: {
        url: upload.url,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (arquivoTemporario) {
      await unlink(arquivoTemporario).catch(() => null);
    }
  }
}
