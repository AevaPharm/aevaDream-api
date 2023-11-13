const mongoose = require("mongoose")

const Schema = mongoose.Schema

const employeeSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    loggedIn: {
        type: Boolean,
        default: false // if you want to log people in automatically after registering set this to true
    },
    profileData: {
        type: Object,
        required: true
    }
},
    // {collection: "Employees"}
)

module.exports = mongoose.model("Employee", employeeSchema)