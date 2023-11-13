const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.cookies.token
  try {
    const user = jwt.verify(token, process.env.PASSWORD_HASH)
    req.user = user
    next()
  } catch (err) {
    res.clearCookie("token")
    return res.redirect("/auth/login")
  }
}

module.exports = authMiddleware


