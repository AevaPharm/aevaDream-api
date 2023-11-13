const mongoose = require("mongoose")
const Schema = mongoose.Schema

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    streetTwo: {type: String, required: false},
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true }
});

const patientSchema = new Schema({
    identifier: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    name: { type: String, required: true },
    preferredLanguage: String,
    allergies: [String],
    reviewAllergies: { type: Boolean, default: false },
    reviewMedicalConditions: { type: Boolean, default: false },
    gender: { type: String, enum: ['M', 'F', 'O'] },
    dob: Date,
    phone: String,
    deliveryPreference: { type: String, enum: ['Delivery', 'Pick Up'] },
    addresses: {
        primary: addressSchema,
        delivery: addressSchema
    },
    notes: [String],
    prescriber: String,
    dea: String,
    npi: String,
    prescriberAddress: addressSchema,
    prescriberPhone: String,
    prescriberFax: String,
    activePrescriptions: mongoose.Schema.Types.Mixed,
    inactivePrescriptions: {type: Object, required: true, default: {}}
});

module.exports = mongoose.model("Patient", patientSchema)