const eventEmitter = require("../listeners/emailListeners")
const { generateToken } = require("../utils/jwtHelpers")

exports.sendVerificationMail = (user) => {
  try {
    const token = generateToken(
      { userId: user.id },
      process.env.VERIFY_JWT_SECRET,
      "10m"
    )
    const verifyUrl = `${process.env.APP_FRONTEND_URL}/verify/email/?token=${token}`

    eventEmitter.emit("verifyEmail", {
      recipient: user.email,
      verifyLink: verifyUrl,
      name: user.name,
    })
  } catch (err) {
    throw err
  }
}

exports.sendPasswordResetMail = (user) => {
  try {
    const token = generateToken(
      { userId: user.id },
      process.env.RESET_JWT_SECRET,
      "10m"
    )
    const resetUrl = `${process.env.APP_FRONTEND_URL}/password/update/?token=${token}`

    eventEmitter.emit("resetPassword", {
      recipient: user.email,
      resetLink: resetUrl,
      name: user.name,
    })
    return token
  } catch (err) {
    throw err
  }
}

exports.sendPasswordUpdateMail = (user) => {
  try {
    eventEmitter.emit("passwordUpdated", {
      recipient: user.email,
      name: user.name,
    })
  } catch (err) {
    throw err
  }
}
