const express = require("express");
const { upload } = require("../lib/uploadImages");
const {
  getAllProducts,
  postProduct,
  getProduct,
  getCart,
  getStoreProducts,
  getStoreInfo,
  getEnums,
} = require("../controllers/productController");
const router = express.Router();
const authMiddleWare = require("../middleware/authMiddleware");

router.get("/", getAllProducts);
router.get("/enums", getEnums);
router.get("/store_products/:storeId", getStoreProducts);
router.get("/store_info/:storeId", getStoreInfo);
router.get("/:id", getProduct);
router.post(
  "/post_product",
  authMiddleWare,
  upload.array("images", 10),
  postProduct,
);

module.exports = router;
