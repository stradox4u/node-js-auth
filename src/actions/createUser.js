const bcrypt = require('bcryptjs')

const db = require("../../models")

exports.createUser = async (
  input
) => {
  try {
    const hashedPw = await bcrypt.hash(input.password, 12)

    const newUser = await db.User.create({
      name: input.name,
      email: input.email,
      password: hashedPw,
    })

    return newUser
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    return err
  }
}