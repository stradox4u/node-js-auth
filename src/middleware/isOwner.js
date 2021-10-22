module.exports = (req, res, next) => {
  try {
    if (req.params.userId !== req.user.id) {
      const error = new Error("Forbidden")
      error.statusCode = 403
      throw error
    }
    next()
  } catch (err) {
    next(err)
    return err
  }
}
