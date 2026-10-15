const multer = require("multer");
const cloudinary = require("../cloudinary/cloudinary");
const { Readable } = require("stream");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const uploadFileToCloudinary = (
  buffer,
  storeName = "store",
  productName = null,
) => {
  if (!buffer) return null;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: productName
          ? `stores/${storeName.trim()}/${productName.trim()}`
          : `stores/${storeName.trim()}`,
      },
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

const deleteImagesFromCloudinary = async (publicIdArray) => {
  const deleted = await Promise.all(
    publicIdArray.map((id) => cloudinary.uploader.destroy(id)),
  );

  return deleted;
};

module.exports = { upload, uploadFileToCloudinary,deleteImagesFromCloudinary };
