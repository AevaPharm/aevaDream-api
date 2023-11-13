const express = require("express")
const controllers = require("../controllers/employeeControllers")
const auth = require("../middleware/auth")
const {checkIdPost, checkIdGet, checkIds} = require("../middleware/checkId")

const router = express.Router()

// login
router.post("/login", controllers.login)

// register
router.post("/register", controllers.registerNewUser)

// logout
router.post("/logout", checkIdPost, controllers.logout)

// unlock
router.post("/unlock", checkIdPost, controllers.unlockApp)

// GET work queues
router.post("/getQueues", checkIdPost, controllers.getQueues)

// GET queue
router.post("/getQueue", checkIdPost, controllers.getQueue)

// clear work queue
router.post("/clearQueue", checkIdPost, controllers.clearWorkQueue)

// Drop queues
router.post("/dropQueues", checkIdPost, controllers.dropQueues)

// replace user queue
router.post("/replaceQueue", checkIdPost, controllers.replaceQueue)

// adds data to an employee's queue
router.post("/addToQueue", checkIdPost, controllers.addToQueue)

// remove a customer from employee queue
router.post("/removeFromQueue", checkIdPost, controllers.removeFromQueue)

// removes prescriptions from employee queue
router.post("/removePrescriptions", checkIdPost, controllers.removePrescriptionsFromQueue)

// reset pin
router.post("/resetPin", checkIdPost, controllers.resetPin)

// generate reset token
router.get("/createResetToken", controllers.createResetToken)

// reset password
router.post('/resetPw', controllers.resetPassword)

// upload profile photo
// router.post("/uploadProfilePhoto/", controllers.uploadProfilePhoto)

// update profile
router.post("/updateProfile", checkIdPost, controllers.updateProfile)

// gets user
router.post("/getProfile", checkIds, controllers.getEmployeeProfile)

// update job roles // restricted to managers and higher
router.post("/changeUserJobRoles", auth, checkIds, controllers.changeJobRoles)

// update work schedule (days and hours) // restricted to managers and higher
router.post("/updateJobSchedule", auth, checkIds, controllers.updateWorkSchedule)

// mark employee as inactive // will remove login information from user's account (restricted to admin and SuperAdmin) when an employee leaves the company
router.post("/markUserAsInactive", auth, checkIds, controllers.markAsInactive)

router.post("/markUserAsActive", auth, checkIds, controllers.markAsActive)



module.exports = router
