function authorizeMiddleWare(req, res, next) {
  const storeId = req?.params?.storeId;
  if (req.user.id !== storeId)
    return res
      .status(403)
      .send({ success: false, message: "Not permitted to view this page" });
  next();
}

module.exports = authorizeMiddleWare;
