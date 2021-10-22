const passport = require("passport")
const localStrat = require("passport-local")
const jwtStrat = require("passport-jwt")
const { ExtractJwt } = require("passport-jwt")
const bcrypt = require("bcryptjs")

const db = require("../../models")

const LocalStrategy = localStrat.Strategy
const JwtStrategy = jwtStrat.Strategy

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (username, password, done) {
      return db.User.findOne({
        where: { email: username },
      })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Incorrect email!" })
          }
          return bcrypt.compare(password, user.password).then((result) => {
            if (!result) {
              return done(null, false, { message: "Incorrect password!" })
            }
            return done(null, user)
          })
        })
        .catch((err) => {
          return done(err)
        })
    }
  )
)

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ACCESS_JWT_SECRET,
    },
    function (jwt_payload, done) {
      return db.User.findOne({
        where: { id: jwt_payload.userId },
      })
        .then((user) => {
          return done(null, user || false)
        })
        .catch((err) => {
          return done(err, false)
        })
    }
  )
)

module.exports = passport
