const express = require("express")
const controllers = require("../controllers/prescriptionControllers")
const auth = require("../middleware/auth")
const { checkIdPost} = require("../middleware/checkId")

const router = express.Router()

router.post("/markActive", controllers.markAsActive)

router.post("/markInactive", controllers.markAsInactive)

// router.post("/addRx", controllers.addPrescriptions)

router.post("/getRx", controllers.getPrescription)

router.post("/getPrescriptions", controllers.getPrescriptions)

router.post("/updateRx", controllers.updatePrescription)

router.post("/removeRx", checkIdPost, controllers.removePrescription)

router.get("/getProfit", controllers.calculateProfitByMarketer)

router.post("/addNote", controllers.addNote)

router.post("/removeNote", controllers.removeNote)

module.exports = router