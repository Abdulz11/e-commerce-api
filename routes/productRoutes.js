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

// each product
router.get("/:id", getProduct);

router.put(
  "/edit_product/:productId",
  authenticateMiddleWare,
  upload.array("images", 10),
  editProduct,
);

router.post(
  "/post_product",
  authenticateMiddleWare,
  upload.array("images", 10),
  postProduct,
);

module.exports = router;
