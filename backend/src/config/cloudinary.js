import { v2 as cloudinary } from "cloudinary";
import logger from "./logger.js";

let isConfigured = false;
let warningLogged = false;

function getCloudinaryEnv() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY?.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim(),
  };
}

function hasRequiredCloudinaryEnv() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();
  return Boolean(cloudName && apiKey && apiSecret);
}

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function isCloudinaryEnabled() {
  return hasRequiredCloudinaryEnv();
}

export function getCloudinaryClientOrThrow() {
  if (isConfigured) {
    return cloudinary;
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryEnv();

  if (!cloudName || !apiKey || !apiSecret) {
    if (!isProductionEnvironment() && !warningLogged) {
      logger.warn(
        "Cloudinary desabilitado neste ambiente (CLOUDINARY_* ausentes). Upload ficará indisponível."
      );
      warningLogged = true;
    }

    throw Object.assign(
      new Error("Serviço de upload temporariamente indisponível."),
      { statusCode: 503 }
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
  return cloudinary;
}
