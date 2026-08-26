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
} = require("../controllers/storeController");
const authMiddleWare = require("../middleware/authMiddleware");

router.get("/", getStores);
router.get("/store_info/:storeId", getStoreInfo);
router.post("/registration", registerStore);
router.put("/edit_profile/:storeId", authMiddleWare, editProfile);
router.post("/signin", signInStore);
router.post("/logout", logOut);
router.post("/refresh_token", getNewAccessToken);

module.exports = router;
