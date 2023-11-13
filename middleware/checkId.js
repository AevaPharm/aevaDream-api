const mongoose = require("mongoose")
function checkIdGet(req, res, next) {
    const {id} = req.params
    if(mongoose.Types.ObjectId.isValid(id)) {
        next()
    } else {
        return res.status(422).json({error: "Invalid ID. Please Log In Again"})
    }
}
function checkIdPost(req, res, next) {
    const {id} = req.body
    if(mongoose.Types.ObjectId.isValid(id)) {
        next()
    } else {
        return res.status(422).json({error: "Invalid ID. Please Log In Again"})
    }
}  

function checkIds(req, res, next) {
    const {requesterId, employeeId} = req.body
    if(mongoose.Types.ObjectId.isValid(requesterId) && mongoose.Types.ObjectId.isValid(employeeId)) {
        next()
    } else {
        return res.status(422).json({error: "Invalid ID"})
    }
}
  
  module.exports = {checkIdGet, checkIdPost, checkIds}