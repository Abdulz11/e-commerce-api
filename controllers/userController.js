const { hash, compare } = require("bcrypt");
const prisma = require("../db/db");
const { getAccessToken, getRefreshToken } = require("../lib/utilityFunctions");

const getUser = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.send(users);
  } catch (e) {
    res.status(400).send("Failed to get users");
    next(e);
  }
};

const getCartCount = async (req, res) => {
  const userId = req.params.id;
  let cart = await prisma.cartItem.count({
    where: { id: userId, role: "CUSTOMER" },
  });
};
const getCart = async (req, res, next) => {
  const id = req.user.id;
  try {
    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) {
      return res.status(404).send("user not found");
    }
    res.send({ cart: user?.cart ?? [] });
  } catch (e) {
    res.status(400).send("Failed to get cart");
    next(e);
  }
};

const addToCart = async (req, res) => {
  // find the item from products
  const userId = req.user.id;
  const id = req.params.id;
  try {
    const product = await prisma.product.findUnique({
      where: { id: id },
    });
    if (!product) {
      console.log("product does not exist");
      return res.status(404).send("Product not found");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { cart: { push: product.id } },
    });
    return res.send("Item added to cart");
  } catch (e) {
    res.status(500).send(e?.message ?? "Internal Error");
  }
};

const registerUser = async (req, res, next) => {
  try {
    // check if email has been used
    const role = req.body.role || "CUSTOMER";
    let user;
    if (role == "STORE") {
      user = await prisma.store.findUnique({
        where: { email: req.body.email },
      });
    } else {
      user = await prisma.customer.findUnique({
        where: { email: req.body.email },
      });
    }

    if (user) {
      return res
        .status(409)
        .json({ success: false, message: "User with email already exists" });
    }
    const { name, email, password, location, whatsapp, description } = req.body;
    // const hashedPassword = await hash(password, 8);
    const hashedPassword = password;
    if (role == "STORE") {
      await prisma.store.create({
        data: {
          name,
          email,
          password: hashedPassword,
          location,
          whatsapp,
          description,
        },
      });
    } else {
      await prisma.customer.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });
    }

    res
      .status(201)
      .json({ success: true, message: "user created successfully" });
  } catch (e) {
    res
      .status(e.status || 500)
      .send({ success: false, message: e.message || "Internal Server Error" });
  }
};

const signIn = async (req, res) => {
  try {
    // check if email exist
    const { email, password, role } = req.body;
    let user;

    if (role == "STORE") {
      user = await prisma.store.findUnique({
        where: { email: email },
      });
    } else {
      user = await prisma.customer.findUnique({
        where: { email: email },
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: `${role.charAt(0) + role.slice(1).toLowerCase()} with the email ${email} does not exist`,
      });
    }
    // const doesPasswordMatch = await compare(password, user.password);
    const doesPasswordMatch = true;

    if (!doesPasswordMatch)
      return res.status(400).json({
        success: false,
        message: "Password is wrong",
      });

    const accessToken = getAccessToken(user.id, user.email);
    const refreshToken = getRefreshToken(user.id, user.email);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "user/refresh_token",
    });
    res.send({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ success: false, message: e?.message || "Internal Server Error" });
  }
};

const logOut = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    path: "user/refresh_token",
  });
  // remove refresh from database as well
  console.log("logged out");
  res.status(204).json({ success: false, message: "logged out" });
};

const getNewAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.send({ accessToken: "", message: "Sign in again" });
  try {
    const token = verify(
      req.cookies.refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    console.log(token);
    const user = await prisma.user.findUnique({ where: { id: token.id } });
    if (!user) throw new Error({ accessToken: "", message: "Sign in again" });
    const newAccessToken = getAccessToken(token.id, token.email);
    const newRefreshToken = getRefreshToken(token.id, token.email);

    // replace refresh token in db with the newRefreshToken

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      path: "user/refresh_token",
    });
    res.status(200).send({ accessToken: newAccessToken });
  } catch (e) {
    res.send(e.message);
  }
};

module.exports = {
  getUser,
  getCart,
  registerUser,
  signIn,
  logOut,
  getNewAccessToken,
  addToCart,
  getCartCount,
};
