const express = require("express");
const { upload } = require("../lib/uploadImages");
const {
  getAllProducts,
  postProduct,
  getProduct,
  getStoreProducts,
  getStoreInfo,
  getCatAndSubCatEnums,
  editProduct,
} = require("../controllers/productController");
const router = express.Router();
const authMiddleWare = require("../middleware/authMiddleware");

router.get("/", getAllProducts);
router.get("/categ_and_subCateg_enums", getCatAndSubCatEnums);
router.put("/edit_product/:productId", authMiddleWare, editProduct);
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
