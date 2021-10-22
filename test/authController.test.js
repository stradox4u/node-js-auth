const { expect } = require("chai")
const sinon = require("sinon")
const bcrypt = require("bcryptjs")

const db = require("../models")
const {
  patchPasswordUpdate,
  patchVerifyEmail,
  postLogin,
  postLogout,
  postPasswordReset,
  postRefreshTokens,
} = require("../src/controllers/authController")
const { generateToken } = require("../src/utils/jwtHelpers")
const sendMails = require("../src/actions/sendEmails")

describe("Auth Controller Tests", () => {
  beforeEach(() => {
    process.env.ACCESS_JWT_SECRET = "oompaloompa"
    process.env.REFRESH_JWT_SECRET = "akwanya1"
  })
  it("Sets the refresh cookie and returns the user on login", async () => {
    const req = {
      user: {
        id: "UserId",
        name: "Test User",
        email: "test@test.com",
      },
    }

    const res = {
      cookieText: "",
      cookieName: "",
      statusCode: 500,
      user: {},
      cookie: function (name, value) {
        this.cookieText = value
        this.cookieName = name
        return this
      },
      status: function (code) {
        this.statusCode = code
        return this
      },
      json: function (data) {
        this.user = data.user
      },
    }

    await postLogin(req, res, () => { })

    expect(res).to.have.property("cookieName", "refresh_cookie")
    expect(res).to.have.property("statusCode", 200)
    expect(res.user.id).to.equal("UserId")
    expect(res.user.name).to.equal("Test User")
    expect(res.user.email).to.equal("test@test.com")
  })

  it("Blacklists the refresh token on logout", async () => {
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "hashedPassword",
    })
    const req = {
      cookies: {
        refresh_cookie: "aRefreshCookieHere",
      },
      user: { id: newUser.id },
    }
    await postLogout(req, {}, () => { })

    const updatedUser = await db.User.findOne({
      where: { id: newUser.id },
    })

    expect(updatedUser.blacklisted_tokens).to.contain("aRefreshCookieHere")

    await db.User.destroy({
      truncate: true,
    })
  })

  it("Returns the correct response on logout", async () => {
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "hashedPassword",
    })
    const req = {
      cookies: {
        refresh_cookie: "aRefreshCookieHere",
      },
      user: { id: newUser.id },
      logout: function () {
        this.user = { id: null }
      },
    }
    const res = {
      statusCode: 500,
      message: "",
      status: function (code) {
        this.statusCode = code
        return this
      },
      json: function (data) {
        this.message = data.message
      },
    }
    await postLogout(req, res, () => { })

    expect(res.statusCode).to.equal(200)
    expect(res.message).to.equal("Logged out")

    await db.User.destroy({
      truncate: true,
    })
  })

  it("Correctly verifies the user's email address", async () => {
    process.env.VERIFY_JWT_SECRET = "s1rL3wis"
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "hashedPassword",
    })

    const verifyToken = generateToken(
      { userId: newUser.id },
      process.env.VERIFY_JWT_SECRET,
      "10m"
    )

    const req = {
      body: {
        token: verifyToken,
      },
    }

    await patchVerifyEmail(req, {}, () => { })
    const updatedUser = await db.User.findOne({
      where: { id: newUser.id },
    })

    expect(updatedUser.email_verified_at).not.to.equal(null)

    await db.User.destroy({
      truncate: true,
    })
  })

  it("Throws error if user is not found on password reset request", async () => {
    process.env.RESET_JWT_SECRET = "s1rL3wis"
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "hashedPassword",
    })

    const req = {
      body: {
        email: "notTest@test.com",
      },
    }

    const emailStub = sinon.stub(sendMails, "sendPasswordResetMail")
    const result = await postPasswordReset(req, {}, () => { })

    expect(result).to.throw
    expect(result).to.have.property("statusCode", 404)

    await db.User.destroy({
      truncate: true,
    })
    emailStub.restore()
  })

  it("Sends an email to the user on password reset request", async () => {
    process.env.RESET_JWT_SECRET = "s1rL3wis"
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "hashedPassword",
    })

    const req = {
      body: {
        email: "test@test.com",
      },
    }
    const emailStub = sinon.stub(sendMails, "sendPasswordResetMail")
    await postPasswordReset(req, {}, () => { })

    expect(emailStub.called).to.be.true
    await db.User.destroy({
      truncate: true,
    })

    emailStub.restore()
  })

  it("Successfully updates the user's password", async () => {
    process.env.RESET_JWT_SECRET = "s1rL3wis"
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "password",
    })

    const token = generateToken(
      { userId: newUser.id },
      process.env.RESET_JWT_SECRET,
      "10m"
    )
    newUser.password_reset_token = token
    await newUser.save()

    const req = {
      body: {
        password: "newPassword",
        token: token,
      },
    }

    const emailStub = sinon.stub(sendMails, "sendPasswordUpdateMail")

    await patchPasswordUpdate(req, {}, () => { })

    const user = await db.User.findOne({
      where: { id: newUser.id },
    })
    const passwordUpdated = await bcrypt.compare(
      req.body.password,
      user.password
    )

    expect(passwordUpdated).to.be.true

    await db.User.destroy({
      truncate: true,
    })
    emailStub.restore()
  })

  it("Sends an email on successful password update", async () => {
    process.env.RESET_JWT_SECRET = "s1rL3wis"
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "password",
    })

    const token = generateToken(
      { userId: newUser.id },
      process.env.RESET_JWT_SECRET,
      "10m"
    )
    newUser.password_reset_token = token
    await newUser.save()

    const req = {
      body: {
        password: "newPassword",
        token: token,
      },
    }

    const emailStub = sinon.stub(sendMails, "sendPasswordUpdateMail")

    await patchPasswordUpdate(req, {}, () => { })

    expect(emailStub.called).to.be.true

    await db.User.destroy({
      truncate: true,
    })
    emailStub.restore()
  })

  it("Sets the refresh cookie and returns the access token and user on token refresh", async () => {
    const newUser = await db.User.create({
      name: "Test User",
      email: "test@test.com",
      password: "password",
    })
    const refreshCookie = generateToken(
      {
        userId: newUser.id,
      },
      process.env.REFRESH_JWT_SECRET,
      "7d"
    )
    const req = {
      cookies: {
        refresh_cookie: refreshCookie,
      },
    }

    const res = {
      cookieText: "",
      cookieName: "",
      statusCode: 500,
      user: {},
      cookie: function (name, value) {
        this.cookieText = value
        this.cookieName = name
        return this
      },
      status: function (code) {
        this.statusCode = code
        return this
      },
      json: function (data) {
        this.user = data.user
      },
    }

    await postRefreshTokens(req, res, () => { })

    expect(res).to.have.property("cookieName", "refresh_cookie")
    expect(res).to.have.property("cookieText", refreshCookie)
    expect(res).to.have.property("statusCode", 200)
    expect(res.user.id).to.equal(newUser.id)
    expect(res.user.name).to.equal("Test User")
    expect(res.user.email).to.equal("test@test.com")

    await db.User.destroy({
      truncate: true,
    })
  })
})
