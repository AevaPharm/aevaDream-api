const mongoose = require("mongoose")
const MongooseValidator = require("mongoose-validatorjs")
const Schema = mongoose.Schema

const refillSchema = new Schema({
    filledBy: String,
    filledOn: Date,
    checkedBy: String,
    checkedOn: Date,
    paymentMethod: String,
    primaryInsurer: String,
    secondaryInsurer: String,
    dispensedQuantity: Number,
    daySupplyEnd: Date,
    pharmacist: String,
    ingredientCost: Number,
    ingredientCostPaid: Number,
    dispensingFee: Number,
    dispensingFeePaid: Number,
    totalPrice: Number,
    totalPricePaid: Number,
    patientPaidAmount: Number,
    netProfit: Number,
    grossProfit: Number,
    refillNumber: Number,
    refillsRemaining: Number,
    ndc: String,
    fillType: String,
    completedOn: Date
  }, {
    timestamps: true
  })

const prescriptionSchema = new Schema({
    identifier: String,
    active: String,
    amountInStock: Number,
    checkedBy: String,
    checkedOn: Date,
    completedOn: Date,
    controlledSubstance: String,
    counceledBy: String,
    counceledOn: Date,
    department: String,
    directions: String,
    directionsSpanish: String,
    dispensedQuantity: Number,
    dispensingFee: Number,
    dispensingFeePaid: Number,
    expiresOn: Date,
    filledBy: String,
    filledOn: Date,
    grossProfit: Number,
    ingredientCost: Number,
    ingredientCostPaid: Number,
    marketerName: String,
    name: String,
    ndc: String,
    needsPreCheck: String,
    netProfit: Number,
    newRenewal: Date,
    nextFill: Date,
    notes: [String],
    origin: String,
    patient: String,
    patientPaidAmount: Number,
    payMethod: String,
    pharmacist: String,
    pharmacy: String,
    prescriptionType: String,
    primaryClaimMessage: String,
    primaryGroupNumber: String,
    primaryInsurer: String,
    queue: String,
    refillOrNew: String,
    refills: {
      type: Map,
      of: refillSchema
    },
    refillsRemaining: Number,
    refillsTotal: Number,
    renewalComment: String,
    renewalSentDate: Date,
    renewalSentTo: String,
    renewedFrom: String,
    rxNumber: Number,
    secondaryClaimMessage: String,
    secondaryInsurer: String,
    soldOTC: String,
    status: String,
    strength: String,
    totalPrice: Number,
    totalPricePaid: Number,
    transactionStatus: String,
    writtenOn: Date
  }, {
    timestamps: true
  })

module.exports = mongoose.model("Prescription", prescriptionSchema)