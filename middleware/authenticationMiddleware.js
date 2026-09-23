const { verifyToken } = require("../lib/utilityFunctions");

function authMiddleWare(req, res, next) {
  const authHeader = req?.headers?.authorization;

  if (!authHeader || !authHeader?.startsWith("Bearer ")) {
    return res.send({
      message: "Authentication required. No token is being sent",
      success: false,
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const tokenResponse = verifyToken(token, "access");
    req.user = {
      id: tokenResponse?.id,
    };
    next();
  } catch (e) {
    return res
      .status(401)
      .send({ success: false, message: "Invalid or expired token " });
  }
}

module.exports = authMiddleWare;
