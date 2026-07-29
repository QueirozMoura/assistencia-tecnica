import cloudinary from "../config/cloudinary.js";

const CLOUDINARY_FOLDER = "assistencia-tecnica/produtos";

export async function uploadImagemProdutoCloudinary(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: CLOUDINARY_FOLDER,
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
  };
}
