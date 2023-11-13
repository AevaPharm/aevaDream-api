const mongoose = require("mongoose")
const Prescription = require("../models/prescriptionModel")
const Patient = require("../models/patientModel")
const { encrypt, decrypt, deterministicEncryption } = require("./encryption.js")


// add prescriptions and add prescription has to go through the Pioneer API first.
// 

// const addPrescriptions = async (req, res) => {
//     const { prescriptions, customer } = req.body;
//     let totalPrescriptionsAdded = 0;
//     let duplicatePrescriptions = [];
//     let prescriptionArray = [];
//     let customerId = customer.id || customer._id;

//     if (verifyId(customerId)) {
//         const processPrescription = async (prescription) => {
//             let prescriptionIdentifier = deterministicEncryption(`${customerId} ${prescription.rxNum}`)
//             try {
//                 const existingPrescriptionDoc = await Prescription.findOne({ identifier: prescriptionIdentifier }).select("_id").exec();
//                 if (!existingPrescriptionDoc) {
//                     let routeInfo = { ...prescription.routeInfo }
//                     Reflect.deleteProperty(prescription, routeInfo)
//                     let encryptedPrescription = encrypt(JSON.stringify(prescription), "customer")
//                     let newPrescription = {
//                         identifier: prescriptionIdentifier,
//                         nextFill: routeInfo.nextFill || new Date(),
//                         status: routeInfo.status,
//                         queue: routeInfo.queue || null,
//                         department: routeInfo.department || null,
//                         // status: "ready to bill",
//                         // queue: "queue",
//                         // department: "billing",
//                         active: !routeInfo.inactive,
//                         info: routeInfo.info || null,
//                         customer: customerId,
//                         prescriptionInformation: encryptedPrescription

//                     }
//                     const doc = await Prescription.create(newPrescription)
//                     prescriptionArray.push({
//                         ...newPrescription,
//                         id: doc._id,
//                         prescriptionInformation: prescription
//                     })
//                     customer.customerData.activePrescriptions[prescription.rxNum] = doc._id
//                     let encryptedCustomerData = encrypt(JSON.stringify(customer.customerData), "customer")
//                     let updated = await Customer.findByIdAndUpdate(customer.id, { customerData: encryptedCustomerData }).exec()
//                     totalPrescriptionsAdded += 1
//                 } else {
//                     duplicatePrescriptions.push({ rxNum: prescription.rxNum, name: prescription.name });
//                 }
//             } catch (error) {
//                 throw error
//             }
//         }
//         try {
//             for (const prescription of prescriptions) {
//                 await processPrescription(prescription);
//             }
//             let encryptedCustomerData = encrypt(JSON.stringify(customer.customerData), "customer");
//             await Customer.findByIdAndUpdate(customerId, { customerData: encryptedCustomerData });
//             if (duplicatePrescriptions.length > 0) {
//                 return res.status(200).json({ success: `${totalPrescriptionsAdded} prescriptions have been created successfully`, prescriptionArray });
//             } else {
//                 return res.status(200).json({ success: "All prescriptions have been created successfully", prescriptionArray });
//             }
//         } catch (error) {
//             return res.status(500).json(error);
//         }
//     }
// };


const getPrescription = async (req, res, next) => {
    const { obj } = req.body
    try {
        let prescription = await Prescription.findOne(obj).exec()
        if (!prescription) {
            return res.status(404).json({ error: "no prescription was found" })
        }
        return res.status(200).json({ prescription })

    } catch (err) {
        next(err)
    }
}

const getPrescriptions = async (req, res, next) => {
    const {obj} = req.body
    try {
        const prescriptions = Prescription.find(obj).exec()
        if(!prescriptions) {
            return res.status(404).json({error: "no prescriptions were found"})
        }
        return res.status(200).json({prescriptions})

    } catch(err) {
        next(err)
    }
}

const updatePrescription = async (req, res, next) => {
    const {updatedPrescription} = req.body
    try {
        const updatedPrescriptionData = await Prescription.findOneAndUpdate({identifier: updatedPrescription.identifier}, {...updatedPrescription}).exec()
        if(!updatedPrescriptionData) {
            return res.status(404).json({error: "no prescription found. Try creating one instead"})
        }
        return res.status(200).json({success: "prescription updated successfully"})

    } catch(err) {
        console.log("encountered an error")
        next(err)
    }
}

const markAsInactive = async (req, res, next) => {
    const {identifier} = req.body
    try {
        let updatedPrescription = await Prescription.findOneAndUpdate({identifier}, {active: "inactive"}).exec()
        if(!updatedPrescription) {
            return res.status(404).json({error: "prescription not found"})
        }
        let rxNum = updatedPrescription.rxNumber
        let patientIdentifier = updatedPrescription.patient
        let patient = await Patient.findOne({patientIdentifier}).exec()
        let activePrescriptions = patient.activePrescriptions
        let inactivePrescriptions = patient.inactivePrescriptions
        if(activePrescriptions[rxNum]) {
            Reflect.deleteProperty(activePrescriptions, rxNum)
        }
        inactivePrescriptions[rxNum] = identifier

        await updatedPrescription.save()
        await patient.save()

        return res.status(200).json({success: "prescription successfully marked as inactive"})
    } catch(err) {
        next(err)
    }
}

const markAsActive = async (req, res, next) => {
    const {identifier} = req.body
    try {
        let updatedPrescription = await Prescription.findOneAndUpdate({identifier}, {active: "active"}).exec()
        if(!updatedPrescription) {
            return res.status(404).json({error: "prescription not found"})
        }
        let rxNum = updatedPrescription.rxNumber
        let patientIdentifier = updatedPrescription.patient
        let patient = await Patient.findOne({patientIdentifier}).exec()
        let activePrescriptions = patient.activePrescriptions
        let inactivePrescriptions = patient.inactivePrescriptions
        if(inactivePrescriptions[rxNum]) {
            Reflect.deleteProperty(inactivePrescriptions, rxNum)
        }
        activePrescriptions[rxNum] = identifier

        await updatedPrescription.save()
        await patient.save()

        return res.status(200).json({success: "prescription successfully marked as inactive"})
    } catch(err) {
        next(err)
    }
}


const removePrescription = async (req, res, next) => {
    const {id} = req.body
    try {
        Prescription.findByIdAndDelete(id).exec()
        return res.status(200).json({success: "prescription successfully removed"})
    } catch (err) {
        next(err)
    }
}

const addNote = async (req, res, next) => {
    const {prescriptionIdentifier, note} = req.body
    try {
        const prescription = await Prescription.findOne({identifier: prescriptionIdentifier}).select("notes")
        const noteArray = prescription.notes
        noteArray.unshift(note)
        prescription.markModified("notes")
        await prescription.save()
        return res.status(200).json({success: "Note added"})
    } catch(err) {
        next(err)
    }
}

const removeNote = async (req, res, next) => {
    const {prescriptionIdentifier, note} = req.body
    try {
        const prescription = await Prescription.findOne({identifier: prescriptionIdentifier}).select("notes")
        const noteArray = prescription.notes
        noteArray.splice(noteArray.indexOf(note), noteArray.indexOf(note) !== -1 ? 1 : 0)
        prescription.markModified("notes")
        await prescription.save()
        return res.status(200).json({success: "note deleted"})
    } catch(err) {
        next(err)
    }
}

const calculateProfitByMarketer = async (req, res) => {
    const prescriptions = await Prescription.find({}, {netProfit: 1, _id: 0}).exec()
    let totalProfit = 0

    for (let i = 0; i < prescriptions.length; i++) {
        totalProfit += prescriptions[i].netProfit
    }

    res.status(200).json({ totalProfit })
}

module.exports = {
    // addPrescription,
    // addPrescriptions,
    getPrescription,
    getPrescriptions,
    updatePrescription,
    markAsInactive,
    markAsActive,
    removePrescription,
    calculateProfitByMarketer,
    addNote,
    removeNote
}

