const { Router } = require("express")
const { body } = require("express-validator")

const passport = require("../utils/passport")
const {
  patchPasswordUpdate,
  patchVerifyEmail,
  postLogin,
  postLogout,
  postPasswordReset,
  postRefreshTokens,
  postResendVerificationMail,
} = require("../controllers/authController")
const isOwner = require("../middleware/isOwner")

const router = Router()

router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  postLogin
)

router.post(
  "/logout/:userId",
  passport.authenticate("jwt", { session: false }),
  isOwner,
  postLogout
)

router.post(
  "/verify/resend/:userId",
  passport.authenticate("jwt", { session: false }),
  isOwner,
  postResendVerificationMail
)

router.patch("/verify/email", patchVerifyEmail)

router.post(
  "/password/reset",
  [
    body("email")
      .trim()
      .isString()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email!"),
  ],
  postPasswordReset
)

router.patch(
  "/password/update",
  [
    body("password")
      .trim()
      .isString()
      .isLength({ min: 8 })
      .withMessage("Password must be min. 8 characters!"),
    body("confirm_password").custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Passwords do not match!")
      }
      return true
    }),
    body("token").trim().isString(),
  ],
  patchPasswordUpdate
)

router.post("/tokens/refresh", postRefreshTokens)

module.exports = router
