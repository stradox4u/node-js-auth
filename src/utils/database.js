const { Sequelize } = require("sequelize")

const dbUser = process.env.DB_USERNAME
const dbName = process.env.DB_NAME
const dbPass = process.env.DB_PASSWORD

const sequelize = new Sequelize(
  dbName, dbUser, dbPass, {
  host: 'localhost',
  dialect: 'postgres'
}
)

module.exports = sequelize