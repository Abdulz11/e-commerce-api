const { hash, compare } = require("bcrypt");
const prisma = require("../db/db");
const { getAccessToken, getRefreshToken } = require("../lib/utilityFunctions");
const { verify } = require("jsonwebtoken");

const getUser = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.send(users);
  } catch (e) {
    res.status(400).send("Failed to get users");
    next(e);
  }
};

const viewedProduct = async (req, res, next) => {
  const id = req?.user?.id;
  const viewedProductId = req?.params?.productId;
  try {
    const user = await prisma.customer.findUnique({ where: { id } });
    if (!user || user?.role == "STORE") {
      return res
        .status(404)
        .send({ success: false, message: "user dosent exist" });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (customer.viewedItems.includes(viewedProductId)) {
      return res.send({
        success: true,
        message: "This product has already been added",
      });
    }

    await prisma.customer.update({
      where: {
        id,
      },
      data: {
        viewedItems: {
          push: viewedProductId,
        },
      },
    });
    res.send({ success: true, message: "Product added" });
  } catch (e) {
    console.log(e.message);
    next();
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
    const role = req?.body?.role || "CUSTOMER";
    console.log(role);

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
    const data = req.body;
    const { password } = data;
    const hashedPassword = await hash(password, 8);
    if (role == "STORE") {
      await prisma.store.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
    } else {
      await prisma.customer.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
    }

    res
      .status(201)
      .json({ success: true, message: "user created successfully" });
  } catch (e) {
    console.log("error", e.message);
    res
      .status(e?.status || 500)
      .send({ success: false, message: e?.message || "Internal Server Error" });
  }
};

const signIn = async (req, res) => {
  try {
    console.log(req.body);
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
    console.log(user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: `${role.charAt(0) + role.slice(1).toLowerCase()} with the email ${email} does not exist`,
      });
    }
    const doesPasswordMatch = await compare(password, user.password);

    if (!doesPasswordMatch)
      return res.status(400).json({
        success: false,
        message: "Password is wrong",
      });

    const accessToken = getAccessToken(user.id, user.email, user.role);
    const refreshToken = getRefreshToken(user.id, user.email, user.role);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/user/refresh_token",
    });
    res.send({
      success: true,
      data: {
        accessToken,
        user: {
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
    path: "/user/refresh_token",
  });
  // remove refresh from database as well
  console.log("logged out");
  res.status(200).json({ success: true, message: "logged out" });
};

const getNewAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token)
    return res.status(401).send({ success: false, message: "Sign in again" });
  try {
    const token = verify(
      req.cookies.refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    console.log(token);
    let user;
    if (token.role == "CUSTOMER") {
      user = await prisma.customer.findUnique({ where: { id: token.id } });
    } else {
      user = await prisma.store.findUnique({ where: { id: token.id } });
    }
    if (!user) throw new Error("User does not exist. Login in again ");

    const newAccessToken = getAccessToken(token.id, token.email, token.role);
    const newRefreshToken = getRefreshToken(token.id, token.email, token.role);

    // replace refresh token in db with the newRefreshToken

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      path: "/user/refresh_token",
    });
    res.status(200).send({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (e) {
    res.status(401).send({ success: false, message: e.message });
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
  viewedProduct,
};
