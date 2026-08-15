const express = require("express");
const {
  getUser,
  getCart,
  logOut,
  registerUser,
  signIn,
  getNewAccessToken,
  addToCart,
  getCartCount,
} = require("../controllers/userController");
const authMiddleWare = require("../middleware/authMiddleware");
const router = express.Router();

// router.get("/", getUser);
router.get("/cart", authMiddleWare, getCart);
router.post("/add_to_cart/:id", authMiddleWare, addToCart);
router.post("/registration", registerUser);
router.post("/signin", signIn);
router.get("/cart_count:id", getCartCount);
router.post("/logout", logOut);
router.post("/refresh_token", getNewAccessToken);

module.exports = router;
