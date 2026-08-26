const cloudinary = require("../cloudinary/cloudinary");
const prisma = require("../db/db");
const { uploadFileToCloudinary } = require("../lib/uploadImages");
const catAndSubCatEnums = require("../enums/CatandSubCatEnums");

const getCatAndSubCatEnums = () => {
  return res.status(200).send(catAndSubCatEnums);
};

const editProduct = async (req, res, next) => {
  const storeId = req?.user?.id;
  const productId = req.params.productId;
  const data = req.body;
  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeid: storeId },
    });

    if (!product) {
      return res.status(403).send({
        message:
          "This product does not exist or you do not have permission to update it.",
      });
    }
    const updatedProduct = await prisma.product.update({
      where: { id: productId, storeid: storeId },
      data: data,
    });
  } catch (e) {
    next(e);
  }
};
const getAllProducts = async (req, res, next) => {
  const category = req?.query?.category;
  console.log("category", category);
  // console.log(await prisma.category.findMany());
  // return res.send();

  let products;
  try {
    if (category) {
      products = await prisma.product.findMany({
        where: {
          subCategory: {
            category: {
              name: category,
            },
          },
        },
      });
    } else {
      products = await prisma.product.findMany();
    }
    return res.send(products);
  } catch (e) {
    next(e);
  }
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

  const productsCount = await prisma.product.count({
    where: { storeId: storeId },
  });
  const products = await prisma.product.findMany({
    where: { storeId: storeId },
  });

  res.send({ products, productsCount });
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
  getCatAndSubCatEnums,
  getAllProducts,
  postProduct,
  getProduct,
  getStoreProducts,
  getStoreInfo,
  // getEnums,
  editProduct,
};
