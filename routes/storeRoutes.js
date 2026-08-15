const express = require("express");
const router = express.Router();
const {
  getStores,
  registerStore,
  signInStore,
  logOut,
  getNewAccessToken,
} = require("../controllers/storeController");

router.get("/", getStores);
router.post("/registration", registerStore);
router.post("/signin", signInStore);
router.post("/logout", logOut);
router.post("/refresh_token", getNewAccessToken);

module.exports = router;
