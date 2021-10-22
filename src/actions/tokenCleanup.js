const db = require("../../models")
const { decodeToken } = require("../utils/jwtHelpers")

module.exports = async () => {
  const allUsers = await db.User.findAll()

  allUsers.forEach(async (user) => {
    const filtered = user.blacklisted_tokens.filter(
      (token) => token !== null
    )
    filtered.forEach((token, index) => {
      try {
        const decodedToken = decodeToken(token, process.env.REFRESH_JWT_SECRET)
        if (decodedToken) {
          return
        }
      } catch (err) {
        if (err.message === "jwt expired") {
          filtered.splice(index, 1)
        }
      }
    })
    user.blacklisted_tokens = filtered
    await user.save()
  })
}