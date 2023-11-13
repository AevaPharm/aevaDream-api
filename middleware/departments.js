const mongoose = require("mongoose")
const Queue = require("../models/departmentQueueModel")

async function verifyDepartmentExists(req, res, next) {
    const {department} = req.body
    let departmentId = await Queue.findOne({department}).select("_id")

    if(departmentId) {
        next()
    } else {
        return res.status(404).json({error: "department does not exist"})
    }
}

module.exports = verifyDepartmentExists