const { EventEmitter } = require("events")
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const sender = process.env.SENDGRID_SENDER_EMAIL

const eventEmitter = new EventEmitter()

eventEmitter.on("verifyEmail", async (inputs) => {
  const msg = {
    to: inputs.recipient,
    from: sender,
    templateId: process.env.VERIFY_EMAIL_TEMPLATE_ID,
    dynamicTemplateData: {
      name: inputs.name,
      verifyLink: inputs.verifyLink,
    },
  }

  try {
    const sentMail = await sgMail.send(msg)
    if (sentMail) {
      console.log("Email sent!")
    }
  } catch (err) {
    console.log(err)
  }
})

eventEmitter.on(
  "resetPassword",
  async (inputs) => {
    const msg = {
      to: inputs.recipient,
      from: sender,
      templateId: process.env.RESET_PASSWORD_TEMPLATE_ID,
      dynamicTemplateData: {
        name: inputs.name,
        resetLink: inputs.resetLink,
      },
    }
    try {
      const sentMail = await sgMail.send(msg)
      if (sentMail) {
        console.log("Email sent!")
      }
    } catch (err) {
      console.log(err)
    }
  }
)

eventEmitter.on(
  "passwordUpdated",
  async (inputs) => {
    const msg = {
      to: inputs.recipient,
      from: sender,
      templateId: process.env.UPDATED_PASSWORD_TEMPLATE_ID,
      dynamicTemplateData: {
        name: inputs.name,
      },
    }
    try {
      const sentMail = await sgMail.send(msg)
      if (sentMail) {
        console.log("Email sent!")
      }
    } catch (err) {
      console.log(err)
    }
  }
)

module.exports = eventEmitter