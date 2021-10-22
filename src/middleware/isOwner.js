module.exports = (req, res, next) => {
  try {
    if (req.params.userId !== req.user.id) {
      const error = new MyError("Forbidden", 403)

      throw error
    }
    next()
  } catch (err) {
    next(err)
    return err
  }
}
