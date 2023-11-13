const express = require("express")
const controllers = require("../controllers/departmentQueueControllers")
const auth = require("../middleware/auth")
const verifyDepartmentExists = require("../middleware/departments")

const router = express.Router()

router.get("/clear", verifyDepartmentExists, controllers.clearQueueStatus)

router.post("/create", controllers.addNewQueue)

router.post("/add", verifyDepartmentExists, controllers.addToQueue)

router.post("/count", verifyDepartmentExists, controllers.countQueue)

router.post("/assignCallQueue", controllers.assignCallQueue)

router.post("/assignBillingQueue", controllers.assignBillingQueue)

router.post("/remove", verifyDepartmentExists, controllers.removeFromQueue)

router.post("/createQueue", controllers.createDepartmentQueue)

router.post("/getQueues", verifyDepartmentExists, controllers.getDepartmentQueues)

router.post("/getQueue", verifyDepartmentExists, controllers.getDepartmentQueue)

module.exports = router
