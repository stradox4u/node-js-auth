const express = require('express')
require('dotenv').config()
const cookieParser = require('cookie-parser')
const cors = require('cors')

const passport = require('./utils/passport')
const sequelize = require("./utils/database")
const tokenCleanup = require("./actions/tokenCleanup")

const regRoutes = require("./routes/registerRoutes")
const authRoutes = require("./routes/authenticationRoutes")

const port = process.env.APP_PORT
const routePrefix = "/api/v1"

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: "GET,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(passport.initialize())

app.use(`${routePrefix}/register`, regRoutes)
app.use(`${routePrefix}/auth`, authRoutes)

app.use((error, req, res, next) => {
  const status = error.statusCode || 500
  const message = error.message
  const data = error.data

  res.status(status).json({
    message,
    data,
  })
})

const checkDbConn = () => {
  return sequelize
    .authenticate()
    .then((connection) => {
      console.log("Connection to database successful!")
    })
    .catch((err) => {
      console.log("Unable to connect to database!")
    })
}

checkDbConn()
tokenCleanup()

app.listen(port)

