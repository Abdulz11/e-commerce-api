const cloudinary = require("../cloudinary/cloudinary");
const prisma = require("../db/db");
const { uploadFileToCloudinary } = require("../lib/uploadImages");

const getEnums = async () => {};
const getAllProducts = async (req, res) => {
  const category = req?.query?.category;

  let products;
  if (category) {
    products = await prisma.product.findMany({ where: { category: category } });
  } else {
    products = await prisma.product.findMany();
  }

  return res.send(products);
};

const postProduct = async (req, res, next) => {
  if (!req.user.id) {
    return res.status(409).send("Authentication required");
  }
  const store = await prisma.store.findUnique({ where: { id: req.user.id } });
  const { name, description, price, quantity, category } = req.body;

  let imageArrBuffer = [];
  let imageIds = [];

  if (req.files) {
    imageArrBuffer = req.files.map((f) => f.buffer);
  }
  // console.log("imageArrBuffer", imageArrBuffer);

  try {
    const imageUrls = [];
    if (imageArrBuffer.length > 0) {
      for (const buffer of imageArrBuffer) {
        const file = await uploadFileToCloudinary(buffer, name, store.name);
        imageUrls.push(file?.secure_url);
        imageIds.push(file?.public_id);
      }
    }

    await prisma.product.create({
      data: {
        name,
        description,
        category,
        price: Number(price),
        quantity: Number(quantity),
        imageIds: imageIds,
        imageUrls: imageUrls,
        store: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });

    res.status(201).send("product posted");
  } catch (e) {
    if (imageIds.length > 0) {
      await Promise.allSettled(
        imageIds.map((id) => cloudinary.uploader.destroy(id)),
      );
    }
    next(e);
  }
};

const getStoreProducts = async (req, res) => {
  const storeId = req.params.storeId;

  const products = await prisma.product.findMany({
    where: { storeId: storeId },
  });

  res.send(products);
};

const getStoreInfo = async (req, res) => {
  const storeId = req.params.storeId;
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  if (!store) {
    return res.send("Store id dosent exist");
  }
  const { name, email, whatsapp, location, description } = store;
  return res.send({ name, email, whatsapp, location, description });
};

const getProduct = async (req, res, next) => {
  const id = req.params.id;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    console.log("product", product);
    return res.send(product);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAllProducts,
  postProduct,
  getProduct,
  getStoreProducts,
  getStoreInfo,
};
