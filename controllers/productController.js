const cloudinary = require("../cloudinary/cloudinary");
const prisma = require("../db/db");
const { uploadFileToCloudinary } = require("../lib/uploadImages");
const catAndSubCatEnums = require("../enums/CatandSubCatEnums");

const getCatAndSubCatEnums = (req, res) => {
  return res.status(200).send(catAndSubCatEnums);
};

const editProduct = async (req, res, next) => {
  const storeId = req?.user?.id;
  const productId = req.params.productId;
  const data = req.body;
  const images = req.files;
  let imageArrBuffer = [];
  let imageIds = [];
  const imageUrls = [];

  if (images) {
    imageArrBuffer = req.files.map((f) => f.buffer);
  }

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store)
      return res
        .status(404)
        .send({ error: true, message: "Store does not exist " });

    if (imageArrBuffer.length > 0) {
      for (const buffer of imageArrBuffer) {
        const file = await uploadFileToCloudinary(
          buffer,
          store.name,
          data.name,
        );
        imageUrls.push(file?.secure_url);
        imageIds.push(file?.public_id);
      }
    }
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: storeId },
    });

    if (!product) {
      return res.status(403).send({
        error: true,
        message:
          "This product does not exist or you do not have permission to update it.",
      });
    }

    const catId = await prisma.category.findUnique({
      where: { name: data.category },
    });
    const subCatId = await prisma.subCategory.findUnique({
      where: { name: data.subcategory },
    });

    const { category, subcategory, price, quantity, ...productData } = data;

    const updatedProduct = await prisma.product.update({
      where: { id: productId, storeId: storeId },
      data: {
        ...productData,
        price: Number(price),
        quantity: Number(quantity),
        subCategoryId: subCatId.id,
        imageIds,
        imageUrls,
      },
    });
    console.log(updatedProduct);
    res
      .status(200)
      .send({ success: true, message: "Product updated successfully" });
  } catch (e) {
    next(e);
  }
};

const getAllProducts = async (req, res, next) => {
  const category = req?.query?.category;

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
        include: {
          subCategory: {
            include: {
              category: true,
            },
          },
        },
      });
    } else {
      products = await prisma.product.findMany({
        include: {
          subCategory: {
            include: { category: true },
          },
        },
      });
    }
    return res.send({ success: true, data: products });
  } catch (e) {
    next(e);
  }
};

const postProduct = async (req, res, next) => {
  if (!req.user.id) {
    return res.status(409).send("Authentication required");
  }
  const store = await prisma.store.findUnique({ where: { id: req.user.id } });
  const { name, description, price, quantity, category, currency } = req.body;

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
        const file = await uploadFileToCloudinary(buffer, store.name, name);
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
        currency,
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

const getProduct = async (req, res, next) => {
  const id = req.params.id;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: { omit: { password: true } },
        subCategory: { include: { category: true } },
      },
    });
    return res.send({ success: true, data: product });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getCatAndSubCatEnums,
  getAllProducts,
  postProduct,
  getProduct,
  editProduct,
};
