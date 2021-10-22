const { generateToken } = require("../utils/jwtHelpers")

exports.createTokens = (user) => {
  const token = generateToken(
    { userId: user.id },
    process.env.ACCESS_JWT_SECRET,
    "10m"
  )
  const refreshToken = generateToken(
    { userId: user.id },
    process.env.REFRESH_JWT_SECRET,
    "7d"
  )

  return {
    token: token,
    refreshToken: refreshToken,
  }
}
