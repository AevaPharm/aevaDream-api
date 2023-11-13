const express = require("express")
const controllers = require("../controllers/patientControllers")
const auth = require("../middleware/auth")


const router = express.Router()

router.post("/addPatient", controllers.createPatient)

router.post("/addPatients", controllers.createPatients)

router.post("/getById", controllers.getPatientById)

router.post("/getByIdentifier", controllers.getPatientByIdentifier)

router.post("/markInactive", controllers.markAsInactive)

router.post("/markAsActive", controllers.markAsActive)

router.post("/updatePreferredLanguage", controllers.changePreferredLanguage)

router.post("/update", controllers.updatePatient)

router.post("/addNote", controllers.addNote)

router.post("/removeNote", controllers.removeNote)

module.exports = router



    