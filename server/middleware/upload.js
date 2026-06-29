// server/middleware/upload.js
// Uploads files directly to Cloudinary (cloud storage).
// No files are saved to local disk — works perfectly on Render free plan.

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary is configured via environment variables:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: build a CloudinaryStorage for a given folder and allowed formats
function makeCloudinaryStorage(folder, allowedFormats, resourceType = 'auto') {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder: `prime-builder/${folder}`,
        resource_type: isVideo ? 'video' : 'image',
        allowed_formats: allowedFormats,
        // Use a unique public_id so filenames never clash
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      };
    },
  });
}

// ── Property photos (images only) ───────────────────────────────────────────
const uploadPropertyImages = multer({
  storage: makeCloudinaryStorage('properties', ['jpg', 'jpeg', 'png', 'webp', 'gif']),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
});

// ── Gallery (photos + videos) ────────────────────────────────────────────────
const uploadGalleryMedia = multer({
  storage: makeCloudinaryStorage('gallery', ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm']),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB for HD videos
});

// ── Logo / branding ──────────────────────────────────────────────────────────
const uploadLogo = multer({
  storage: makeCloudinaryStorage('branding', ['jpg', 'jpeg', 'png', 'webp', 'gif']),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Homepage marquee videos (video + optional cover thumbnail) ───────────────
const uploadHomepageVideo = multer({
  storage: makeCloudinaryStorage('homepage-videos', ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm']),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB for HD videos
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

// Export the cloudinary instance so routes can call cloudinary.uploader.destroy()
module.exports = { uploadPropertyImages, uploadGalleryMedia, uploadLogo, uploadHomepageVideo, cloudinary };
