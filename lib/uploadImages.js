const multer = require("multer");
const cloudinary = require("../cloudinary/cloudinary");
const { Readable } = require("stream");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFileToCloudinary = (buffer, productName, storeName = "store") => {
  if (!buffer) return null;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `stores/${storeName.trim()}/${productName.trim()}` },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      },
    );
    Readable.from(buffer).pipe(stream);
  });
};

module.exports = { upload, uploadFileToCloudinary };
