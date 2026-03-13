// middleware/uploadMiddleware.js
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import pkg from "multer-storage-cloudinary";

const { CloudinaryStorage } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "akomaderma/cases",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

export const uploadCaseImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { files: 5, fileSize: 10 * 1024 * 1024 }, // 10 MB
});
