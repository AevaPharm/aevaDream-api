const Patient = require("../models/patientModel")
const { encrypt, decrypt, deterministicEncryption } = require("./encryption.js")

const createPatient = async(req, res, next) => {
    const {patientData} = req.body
    try {
        await Patient.create(patientData).exec()
        return res.status(200).json({success: "patient created successfully"})

    } catch(err) {
        next(err)
    }
}

const createPatients = async(req, res, next) => {
    const {patients} = req.body
    try {
        await Patient.create(patients).exec()
        return res.status(200).json({success: "patients created successfully"})
    } catch(err) {
        next(err)
    }
}

const getPatientById = async (req, res, next) => {
    const {id} = req.body
    try {
        let patientData = await Patient.findById(id).exec()
        if(!patientData) {
            return res.status(404).json({error: "No patient found with the provided id"})
        }
        return res.status(200).json({patientData})

    } catch(err) {
        next(err)
    }
}

const getPatientByIdentifier = async (req, res, next) => {
    const {identifier} = req.body
    try {
        let patientData = await Patient.findBy({identifier}).exec()
        if(!patientData) {
            return res.status(404).json({error: "No patient found with the provided id"})
        }
        return res.status(200).json({patientData})

    } catch(err) {
        next(err)
    }
}

const markAsInactive = async (req, res, next) => {
    const {identifier} = req.body
    try {
        await Patient.findOneAndUpdate({identifier}, {status: "inactive"}).exec()
        return res.status(200).json({success: "Patient marked as inactive"})

    } catch(err) {
        next(err)
    }
}

const markAsActive = async (req, res, next) => {
    const {identifier} = req.body
    try {
        await Patient.findOneAndUpdate({identifier}, {status: "active"}).exec()
        return res.status(200).json({success: "Patient marked as active"})

    } catch(err) {
        next(err)
    }
}

const changePreferredLanguage = async (req, res, next) => {
    const {identifier, newLanguage} = req.body
    try {
        await Patient.findOneAndUpdate({identifier}, {preferredLanguage: newLanguage}).exec()
        return res.status(200).json({success: "patient preferred language updated"})

    } catch(err) {
        next(err)
    }
}

const updatePatient = async (req, res, next) => {
    let {patientData} = req.body
    const identifier = patientData.identifier
    if(patientData.prescriptions) {
        Reflect.deleteProperty(patientData, "prescriptions")
    }
    try {
        const updatedPatient = await Patient.findOneAndUpdate({identifier}, {...patientData}).exec()
        if(updatedPatient) {
            return res.status(200).json({success: "patient updated"})
        }
        return res.status(400).json({error: "patient not updated"})
    } catch(err) {
        next(err)
    }
}

const addNote = async (req, res, next) => {
    const {patientIdentifier, note} = req.body
    try {
        const patient = await Patient.findOne({identifier: patientIdentifier}).select("notes")
        const noteArray = patient.notes
        noteArray.unshift(note)
        patient.markModified("notes")
        await patient.save()
        return res.status(200).json({success: "Note added"})
    } catch(err) {
        next(err)
    }
}

const removeNote = async (req, res, next) => {
    const {patientIdentifier, note} = req.body
    try {
        const patient = await Patient.findOne({identifier: patientIdentifier}).select("notes")
        const noteArray = patient.notes
        noteArray.splice(noteArray.indexOf(note), noteArray.indexOf(note) !== -1 ? 1 : 0)
        patient.markModified("notes")
        await patient.save()
        return res.status(200).json({success: "note deleted"})
    } catch(err) {
        next(err)
    }
}




module.exports = {
    createPatient,
    createPatients,
    getPatientById,
    getPatientByIdentifier,
    markAsInactive,
    markAsActive,
    changePreferredLanguage,
    updatePatient,
    addNote,
    removeNote
}