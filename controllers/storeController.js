const { compare } = require("bcrypt");
const { getAccessToken, getRefreshToken } = require("../lib/utilityFunctions");
const { verify } = require("jsonwebtoken");
const { hash } = require("bcrypt");
const prisma = require("../db/db");
const { uploadFileToCloudinary } = require("../lib/uploadImages");

const getStores = async (req, res) => {
  console.log("finding stores");
  const stores = await prisma.store.findMany();
  res.send({ stores });
};

const getStoreInfo = async (req, res) => {
  const storeId = req?.user?.id;
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return res.send({ message: "Store id dosent exist", error: true });
  }
  const { name, email, whatsapp, location, description, id, img } = store;
  return res.send({
    success: true,
    data: { name, email, whatsapp, location, description, id, img },
  });
};

const getStoreProduct = async (req, res) => {
  const productId = req?.params?.productId;
  const storeId = req?.params?.storeId;

  const productBelongsToOwner = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId: storeId,
    },
  });

  if (!productBelongsToOwner) {
    return res.status(403).send({
      success: false,
      message: "Cannot access this product",
    });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { subCategory: { include: { category: true } } },
  });

  res.send({ success: true, data: product });
};

const getStoreProducts = async (req, res) => {
  const storeId = req.user.id;
  const productsCount = await prisma.product.count({
    where: { storeId },
  });
  const products = await prisma.product.findMany({
    where: { storeId },
  });

  res.send({ success: true, data: { products, productsCount } });
};

// const getStoreInfo = async (req, res) => {
//   const storeId = req.params.storeId;
//   const store = await prisma.store.findUnique({
//     where: { id: storeId },
//   });

//   if (!store) {
//     return res.send("Store id dosent exist");
//   }
//   const { name, email, whatsapp, location, description } = store;
//   return res.send({ name, email, whatsapp, location, description });
// };

const editProfile = async (req, res, next) => {
  const storeId = req.params.storeId;

  if (storeId !== req.user.id) {
    return res.status(403).send({ message: "Unauthorized" });
  }
  let imgId;
  let imgUrl;

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });

    if (req.file && store) {
      const imgBuffer = req.file.buffer;
      const profileImg = await uploadFileToCloudinary(imgBuffer, store.name);
      imgUrl = profileImg.secure_url;
      imgId = profileImg.public_id;
    }
    const { img, ...data } = req.body;

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { ...data, img: imgUrl, imgId: imgId },
    });
    console.log("updated", updatedStore);
    res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      data: updatedStore.name,
    });
  } catch (e) {
    next(e);
  }
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
    res
      .status(201)
      .send({ success: true, message: "store created successfully" });
  } catch (e) {
    next(e);
    res.status(e.status || 500).send(e.message);
  }
};

const signInStore = async (req, res) => {
  try {
    // check if email exist
    const { email, password, role } = req.body;

    const store = await prisma.store.findUnique({
      where: { email: email },
    });

    if (!store) {
      return res.status(400).send("store with the email does not exist ");
    }
    // const doesPasswordMatch = await compare(password, store.password);
    const doesPasswordMatch = true;

    if (!doesPasswordMatch) return res.status(400).send("password is wrong");

    const accessToken = getAccessToken(store.id, store.email);
    const refreshToken = getRefreshToken(store.id, store.email);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/store/refresh_token",
    });
    res.send({
      success: true,
      data: {
        accessToken,
        user: { name: store.name, email: store.email, role: store.role },
      },
    });
  } catch (e) {
    res.status(e.status || 500).send(e?.message);
  }
};

const deleteProduct = async (req, res) => {
  const productId = req?.params?.productId;
  const storeId = req?.user?.id;
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
  });
  if (!product) {
    return res.status(403).send({ message: "Can not find this product" });
  }
  const deletedProduct = await prisma.product.delete({
    where: { id: productId },
  });
  if (deletedProduct)
    return res.status(200).send({
      message: "Product has been successfully deleted",
      success: true,
    });
};

const logOut = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    path: "/store/refresh_token",
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
    // console.log(token);
    const store = await prisma.store.findUnique({ where: { id: token.id } });
    if (!store) throw new Error({ accessToken: "", message: "Sign in again" });
    const newAccessToken = getAccessToken(token.id, token.email);
    const newRefreshToken = getRefreshToken(token.id, token.email);

    // replace refresh token in db with the newRefreshToken

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      path: "/store/refresh_token",
    });
    res.send({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: { name: store.name, email: store.email, role: store.role },
      },
    });
  } catch (e) {
    res.send(e.message);
  }
};
module.exports = {
  getStores,
  registerStore,
  signInStore,
  logOut,
  editProfile,
  deleteProduct,
  getNewAccessToken,
  getStoreInfo,
  getStoreProduct,
  getStoreProducts,
};
