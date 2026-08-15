const { compare } = require("bcrypt");
const { getAccessToken, getRefreshToken } = require("../lib/utilityFunctions");
const { verify } = require("jsonwebtoken");
const { hash } = require("bcrypt");
const prisma = require("../db/db");

const getStores = async (req, res) => {
  console.log("finding stores");
  const stores = await prisma.store.findMany();
  res.send({ stores });
};

const registerStore = async (req, res, next) => {
  try {
    // check if email has been used

    const store = await prisma.store.findUnique({
      where: { email: req.body.email },
    });
    if (store) {
      return res.status(409).send("store with email already exists");
    }
    const { name, email, password } = req.body;
    const hashedPassword = await hash(password, 8);
    await prisma.store.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    res.status(201).send("store created successfully");
  } catch (e) {
    next(e);
    res.status(e.status || 500).send(e.message);
  }
};

const signInStore = async (req, res) => {
  try {
    // check if email exist
    const { email, password } = req.body;

    const store = await prisma.store.findUnique({
      where: { email: email },
    });

    if (!store) {
      return res.status(400).send("store with the email does not exist ");
    }
    const doesPasswordMatch = await compare(password, store.password);

    if (!doesPasswordMatch) return res.status(400).send("password is wrong");

    const accessToken = getAccessToken(store.id, store.email);
    const refreshToken = getRefreshToken(store.id, store.email);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "store/refresh_token",
    });
    res.send({ accessToken, user: { name: store.name, email: store.email } });
  } catch (e) {
    res.status(e.status || 500).send(e?.message);
  }
};

const logOut = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    path: "store/refresh_token",
  });
  // remove refresh from database as well
  // console.log(refreshToken);
  res.status(204).send("logged out");
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
    const store = await prisma.store.findUnique({ where: { id: token.id } });
    if (!store) throw new Error({ accessToken: "", message: "Sign in again" });
    const newAccessToken = getAccessToken(token.id, token.email);
    const newRefreshToken = getRefreshToken(token.id, token.email);

    // replace refresh token in db with the newRefreshToken

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      path: "store/refresh_token",
    });
    res.status(200).send({ accessToken: newAccessToken });
  } catch (e) {
    res.send(e.message);
  }
};
module.exports = {
  getStores,
  registerStore,
  signInStore,
  logOut,
  getNewAccessToken,
};
