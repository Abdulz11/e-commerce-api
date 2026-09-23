const express = require("express");
const { upload } = require("../lib/uploadImages");
const {
  getAllProducts,
  postProduct,
  getProduct,
  getStoreProducts,
  getStoreProduct,
  getCatAndSubCatEnums,
  editProduct,
} = require("../controllers/productController");
const router = express.Router();
const authenticateMiddleWare = require("../middleware/authenticationMiddleware");
const authorizeMiddleWare = require("../middleware/authorizationMiddleware");

router.get("/", getAllProducts);
router.get("/categ_and_subCateg_enums", getCatAndSubCatEnums);
// router.get(
//   "/store_products",
//   authenticateMiddleWare,
//   authorizeMiddleWare,
//   getStoreProducts,
// );
// router.get(
//   "/store_products/:productId",
//   authenticateMiddleWare,
//   getStoreProduct,
// );

// each product
router.get("/:id", getProduct);

router.put(
  "/edit_product/:productId",
  authenticateMiddleWare,
  upload.array("images", 10),
  editProduct,
);
// router.get("/store_info/:storeId", getStoreInfo);
router.post(
  "/post_product",
  authenticateMiddleWare,
  upload.array("images", 10),
  postProduct,
);

module.exports = router;
