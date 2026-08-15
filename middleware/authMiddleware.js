const { verifyToken } = require("../lib/utilityFunctions");

function authMiddleWare(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader.startsWith("Bearer ")) {
    res.send("Authentication required");
  }
  const token = authHeader.split(" ")[1];

  const tokenResponse = verifyToken(token, "access");
  if (!tokenResponse) {
    throw new Error("Unauthorized route");
  }

  req.user = {
    id: tokenResponse?.id,
  };
  next();
}

module.exports = authMiddleWare;
