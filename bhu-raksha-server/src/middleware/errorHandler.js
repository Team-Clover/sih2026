export function errorHandler(error, req, res, next) {
  console.error(error.message)
  if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' })
  res.status(error.status || 500).json({ message: error.expose ? error.message : 'Something went wrong. Please try again.' })
}
