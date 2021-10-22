const { expect } = require("chai")
const Sinon = require("sinon")

const { postRegisterUser } = require("../src/controllers/registrationController")
const db = require("../models")
const sendMails = require("../src/actions/sendEmails")

describe("Registration Controller Tests", () => {
  afterEach(async () => {
    await db.User.destroy({
      truncate: true,
    })
  })
  const req = {
    body: {
      name: "Test User",
      email: "test@test.com",
      password: "password",
      confirm_password: "password",
    },
  }
  it("Is able to register a new user", async () => {
    const myStub = Sinon.stub(sendMails, "sendVerificationMail")

    await postRegisterUser(req, {}, () => { })

    const user = await db.User.findOne({
      where: { name: "Test User" },
    })

    expect(user.dataValues.name).to.equal("Test User")
    expect(user.dataValues.email).to.equal("test@test.com")

    myStub.restore()
  })

  it("Sends verification email on registration", async () => {
    const myStub = Sinon.stub(sendMails, "sendVerificationMail")

    await postRegisterUser(req, {}, () => { })

    expect(myStub.called).to.be.true

    myStub.restore()
  })
})
