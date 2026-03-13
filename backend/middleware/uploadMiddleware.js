// middleware/uploadMiddleware.js
// Multer setup for handling clinical case images.
// Uses memoryStorage because we stream buffers directly to Cloudinary
// in uploadImagesForCase (no local disk writes).

import multer from "multer";

// In-memory storage — files live in RAM as Buffer (file.buffer)
// until Cloudinary upload_stream consumes them.
const storage = multer.memoryStorage();

// Accept only image MIME types (image/jpeg, image/png, etc.)
const imageFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Multer instance used in clinicianRoutes:
// router.post(
//   "/cases/:caseId/images",
//   requireAuth,
//   uploadCaseImages.array("images", 5),
//   uploadImagesForCase
// );
export const uploadCaseImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    files: 5, // match frontend + business rule: max 5 images per case upload
    fileSize: 10 * 1024 * 1024, // 10 MB per image
  },
});
