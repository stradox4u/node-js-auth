exports.filter = (user) => {
  const { id, name, email } = user
  return { id, name, email }
}
