const jwt = require('jsonwebtoken')

exports.generateToken = (payload, key, expiry) => {
  return jwt.sign({ ...payload }, key, { expiresIn: expiry })
}

exports.decodeToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret)
    return decoded
  } catch (err) {
    console.log(err)
    throw err
  }
}