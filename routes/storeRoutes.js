const express = require("express");
const router = express.Router();
const {
  getStores,
  registerStore,
  signInStore,
  logOut,
  getNewAccessToken,
  editProfile,
  getStoreInfo,
  getStoreProduct,
  getStoreProducts,
  deleteProduct,
} = require("../controllers/storeController");
const authenticateMiddleWare = require("../middleware/authenticationMiddleware");
const authorizeMiddleWare = require("../middleware/authorizationMiddleware");
const { upload } = require("../lib/uploadImages");

router.get("/", getStores);
router.get("/store_info/:storeName", authenticateMiddleWare, getStoreInfo);
router.get(
  "/:storeId/products/:productId",
  authenticateMiddleWare,
  authorizeMiddleWare,
  getStoreProduct,
);
router.delete(
  "/:storeId/products/:productId",
  authenticateMiddleWare,
  authorizeMiddleWare,
  deleteProduct,
);
router.get("/:storeId/products", authenticateMiddleWare, getStoreProducts);
router.post("/registration", registerStore);
router.put(
  "/edit_profile/:storeName",
  authenticateMiddleWare,
  upload.single("img"),
  editProfile,
);
router.post("/signin", signInStore);
router.post("/logout", logOut);
router.post("/refresh_token", getNewAccessToken);

module.exports = router;
