const { validationResult } = require('express-validator')

const createUser = require("../actions/createUser")
const { sendVerificationMail } = require("../actions/sendEmails")

exports.postRegisterUser = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed!")
      error.statusCode = 422
      error.data = errors

      throw error
    }
    const body = req.body

    const user = await createUser.createUser(body)

    sendVerificationMail(user)

    res.status(201).json({
      message: "User created successfully!",
      user: user,
    })
  } catch (err) {
    next(err)
  }
}