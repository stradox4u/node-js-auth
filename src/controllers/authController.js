const { Sequelize } = require("sequelize")
const { validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")

const db = require("../../models")
const { decodeToken } = require("../utils/jwtHelpers")
const loginUser = require("../actions/loginUser")
const { getExpiry } = require("../utils/cookieHelpers")
const sendMails = require("../actions/sendEmails")
const filterUser = require("../actions/filterUser")

exports.postLogin = async (req, res, next) => {
  try {
    const { token, refreshToken } = loginUser.createTokens(req.user)
    const expiry = getExpiry()

    const user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    }

    res
      .cookie("refresh_cookie", refreshToken, {
        expires: expiry,
        httpOnly: true,
        // sameSite: "None",
        // secure: true,
      })
      .status(200)
      .json({
        token: token,
        expires_in: 600_000,
        user: user,
      })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
    return err
  }
}

exports.postLogout = async (req, res, next) => {
  try {
    const user = await db.User.update(
      {
        blacklisted_tokens: Sequelize.fn(
          "array_append",
          Sequelize.col("blacklisted_tokens"),
          req.cookies.refresh_cookie
        ),
      },
      {
        where: { id: req.user.id },
        returning: true,
      }
    )
    if (!user[1][0].dataValues) {
      const error = new Error("User not found")
      error.statusCode = 404
      throw error
    }
    req.logout()

    res.status(200).json({
      message: "Logged out",
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
    return err
  }
}

exports.postResendVerificationMail = async (req, res, next) => {
  try {
    sendMails.sendVerificationMail(req.user)
    res.status(200).json({
      message: "Verification email resent successfully",
    })
  } catch (err) {
    if (!err.statuscode) {
      err.statusCode = 500
    }
    next(err)
    return err
  }
}

exports.patchVerifyEmail = async (req, res, next) => {
  try {
    const token = req.body.token
    const decodedToken = decodeToken(
      token,
      process.env.VERIFY_JWT_SECRET
    )

    const userId = decodedToken.userId

    const updatedUser = await db.User.update(
      {
        email_verified_at: new Date(),
      },
      {
        where: { id: userId },
        returning: true,
      }
    )
    if (!updatedUser[1][0].dataValues) {
      const error = new Error("Verification failed")
      throw error
    }
    const filteredUser = filterUser.filter(updatedUser[1][0].dataValues)

    res.status(200).json({
      message: "Email successfully verified",
      user: filteredUser,
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
    return err
  }
}

exports.postPasswordReset = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed!")
      error.statusCode = 422
      error.data = errors
      throw error
    }
    const email = req.body.email
    const user = await db.User.findOne({
      where: { email: email },
    })
    if (!user) {
      const error = new Error("User not found!")
      error.statusCode = 404
      throw error
    }
    const token = sendMails.sendPasswordResetMail(user)

    user.password_reset_token = token
    await user.save()

    res.status(200).json({
      message: "Reset link sent successfully",
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
    return err
  }
}

exports.patchPasswordUpdate = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error("Validation failed!")
      error.statusCode = 422
      error.data = errors
      throw error
    }
    const { token, password } = req.body
    const decodedToken = decodeToken(
      token,
      process.env.RESET_JWT_SECRET
    )
    const { userId } = decodedToken
    const hashedPw = await bcrypt.hash(password, 12)

    const updatedUser = await db.User.update(
      {
        password: hashedPw,
        password_reset_token: null,
      },
      {
        where: {
          id: userId,
          password_reset_token: token,
        },
        returning: true,
      }
    )
    if (!updatedUser[1][0]?.dataValues) {
      const error = new Error("Password update failed!")
      throw error
    }
    sendMails.sendPasswordUpdateMail(updatedUser[1][0].dataValues)

    res.status(200).json({
      message: "Password successfully updated",
    })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
    return err
  }
}

exports.postRefreshTokens = async (req, res, next) => {
  const refToken = req.cookies.refresh_cookie
  try {
    const decodedToken = decodeToken(
      refToken,
      process.env.REFRESH_JWT_SECRET
    )
    const { userId } = decodedToken
    const user = await db.User.findOne({
      where: { id: userId },
    })
    if (!user) {
      const error = new Error("User not found")
      error.statusCode = 404
      throw error
    }
    if (user.blacklisted_tokens?.includes(refToken)) {
      const error = new Error("Unauthorized!")
      error.statusCode = 401
      throw error
    }
    const { token, refreshToken } = loginUser.createTokens(user)
    const filteredUser = filterUser.filter(user)
    const expiry = getExpiry()

    res
      .cookie("refresh_cookie", refreshToken, {
        expires: expiry,
        httpOnly: true,
        // sameSite: "None",
        // secure: true,
      })
      .status(200)
      .json({
        token: token,
        expires_in: 600_000,
        user: filteredUser,
      })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500
    }
    next(err)
    return err
  }
}
