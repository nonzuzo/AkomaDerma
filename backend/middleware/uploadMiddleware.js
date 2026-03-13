// middleware/uploadMiddleware.js
import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

export const uploadCaseImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: { files: 5, fileSize: 10 * 1024 * 1024 }, // 10 MB
});
