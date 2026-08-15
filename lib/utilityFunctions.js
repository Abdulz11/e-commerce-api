const { sign, verify } = require("jsonwebtoken");

function getAccessToken(id, email) {
  try {
    const accessToken = sign({ id, email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "24h",
    });
    return accessToken;
  } catch (e) {
    throw new Error(
      JSON.stringify({ message: e?.message, stack: e?.stack }) ||
        "Something went wrong when generating Rtoken",
    );
  }
}

function getRefreshToken(id, email) {
  try {
    const refreshToken = sign({ id, email }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    return refreshToken;
  } catch (e) {
    throw new Error(
      JSON.stringify({ message: e?.message, stack: e?.stack }) ||
        "Something went wrong when generating Refreshtoken",
    );
  }
}

function verifyToken(token, typeOfToken) {
  if (!token || !typeOfToken) {
    throw new Error("failed to verify token. Check token passed");
  }
  const secret =
    process.env[
      typeOfToken == "refresh" ? "REFRESH_TOKEN_SECRET" : "ACCESS_TOKEN_SECRET"
    ];

  try {
    const payload = verify(token, secret);
    return payload;
  } catch (e) {
    throw new Error(
      JSON.stringify({ message: e?.message, stack: e?.stack }) ||
        "Something went wrong when verifying token",
    );
  }
}

module.exports = { getAccessToken, getRefreshToken, verifyToken };
