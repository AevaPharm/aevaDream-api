const jwt = require("jsonwebtoken")
const {findBy} = require("../users/users-model")
const JWT_SECRET = process.env.JWT_SECRET

const restricted = async(req, res, next) => {
    try {
        const token = req.cookies.token
        if(!token) {
            return res.status(401).json({message: "Token is required"})
        }
        jwt.verify(token, JWT_SECRET, (error, decoded) => {
            if(error) {
                return res.status(401).json({message: "Invalid token"})
            }
            req.token = decoded
        })
    } catch(error) {
        next(error)
    }
}

const only = role_name => (req, res, next) => {
    if(!req.token.role_name || req.token.role_name !== role_name) {
        res.status(403).json({message: "You are not authorized to view this page"})
    }
    next()
}

const checkIfUsernameExists = async (req, res, next) => {
    const {username} = req.body.username
    const existingUser = await findBy(username)
    if(!existingUser) {
        return res.status(401).json({message: "invalid credentials"})
    } else {
        req.existingUser = existingUser
        next()
    }
}

const validateUserRole = (req, res, next) => {
    const role = req.body.role_name.trim()
    if(role !== "call_center" || role !== "biller" || role !== "audit" || role !== "pharmacy" || role !== "admin") {
        return res.status(401).json({message: "Invalid role"})
    }
}

module.exports = {restricted, only, checkIfUsernameExists, validateUserRole}