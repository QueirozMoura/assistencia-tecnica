import { getCloudinaryClientOrThrow } from "../config/cloudinary.js";
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const CLOUDINARY_FOLDER = "assistencia-tecnica/produtos";

export async function uploadImagemProdutoCloudinary(filePath) {
  if (process.env.NODE_ENV === "development" && process.env.UPLOAD_DRIVER === "local") {
    const directory = fileURLToPath(new URL("../../uploads/dev/", import.meta.url));
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${path.extname(filePath)}`;
    await copyFile(filePath, path.join(directory, filename));
    const info = await stat(filePath);
    return {
      url: `http://localhost:${process.env.PORT || 3000}/uploads/dev/${filename}`,
      publicId: `dev/${filename}`,
      format: path.extname(filePath).slice(1),
      bytes: info.size,
    };
  }
  const cloudinary = getCloudinaryClientOrThrow();

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
