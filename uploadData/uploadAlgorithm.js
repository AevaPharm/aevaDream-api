const { getPioneerData, getActiveIds } = require("../sql/getPioneerData")
const mongoose = require('mongoose')
const dynamicRoutes = require("./dynamicRoutes")
const { updateOrInsertPatients, updateOrInsertPrescriptions, uploadQueueData } = require("./syncWithDb")


function chunkIds(ids) {
    let callChunks = []
    let idsCopy = [...ids]
    while (idsCopy.length > 0) {
        let newChunk = idsCopy.splice(0, 50)
        callChunks.push(newChunk)
    }
    return callChunks
}

function chunkRequests(arr) {
    let requestChunks = []
    let arrCopy = [...arr]
    while (arrCopy.length > 0) {
        let newCallChunk = arrCopy.splice(0, 10)
        requestChunks.push(newCallChunk)
    }
    return requestChunks
}

//cleans up notes and creates note array this does not work and is depricated. A better solution is needed
function splitNotes(inputString) {
    // Split by '+', then process each segment by the date and time pattern
    const segments = inputString.split('+');
    let notes = [];

    segments.forEach(segment => {
        // Remove unwanted characters
        const cleanedSegment = segment.replace(/\/\/|\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim();

        // Split the cleaned segment by the date and time pattern
        const pattern = /(\d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2} (?:AM|PM))/g;
        const splitNotes = cleanedSegment.split(pattern);

        for (let i = 1; i < splitNotes.length; i += 2) {
            const date = splitNotes[i];
            const note = splitNotes[i + 1];
            if (note && note.trim() !== '') {
                notes.push(date + note.trim());
            }
        }
    });

    return notes;
}

function sortNotes(notes) {
    return notes.sort((a, b) => {
        // Extract date-time from each note
        const regex = /(\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} [APMapm]{2})|(\d{1,2}\/\d{1,2}\/\d{4}[APMapm]{2})/;
        const aMatch = a.match(regex);
        const bMatch = b.match(regex);

        // If either of the notes doesn't have a timestamp, sort them accordingly
        if (!aMatch && !bMatch) return 0;  // both notes don't have timestamps
        if (!aMatch) return 1;  // 'a' should be at the end
        if (!bMatch) return -1; // 'b' should be at the end

        const aDateStr = aMatch[0].replace(/\s*([APMapm]{2})/, ' $1').toUpperCase();
        const bDateStr = bMatch[0].replace(/\s*([APMapm]{2})/, ' $1').toUpperCase();

        const aDate = new Date(aDateStr);
        const bDate = new Date(bDateStr);

        // Sort in descending order
        return bDate - aDate;
    });
}

async function findNonExistingIds(inputIdentifiers) {
    const collection = mongoose.connection.collection('prescriptions')

    const aggregationResult = await collection.aggregate([
        {
            $match: {
                identifier: { $in: inputIdentifiers }
            }
        },
        {
            $group: {
                _id: null,
                existingIdentifiers: { $push: "$identifier" }
            }
        }
    ]).toArray()

    if (!aggregationResult.length) {
        return inputIdentifiers
    }

    const existingIdentifiers = aggregationResult[0].existingIdentifiers
    const nonExistingIdentifiers = inputIdentifiers.filter(id => !existingIdentifiers.includes(id))
    return nonExistingIdentifiers

}

function parseSanitizedJSON(str) {
    // Replace newline sequences followed by the + character with a space
    str = str.replace(/\r\n/g, ' ').replace(/' \+/g, '');

    let sanitizedStr = '';
    let isInQuote = false; // To track if we're inside a quote.

    for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (char === '"' && !isInQuote) {
            // Check if it's a valid opening quote.
            if (i === 0 || str[i - 1] === '{' || str[i - 1] === ',' || str[i - 1] === ':') {
                isInQuote = true;
            } else {
                // Skip this invalid opening quote.
                continue;
            }
        } else if (char === '"' && isInQuote) {
            // Check if it's a valid closing quote.
            if (str[i + 1] === ',' || str[i + 1] === '}' || str[i + 1] === ':') {
                isInQuote = false;
            } else {
                // Skip this invalid closing quote.
                continue;
            }
        }

        sanitizedStr += char;
    }
    let jsonStr = JSON.parse(sanitizedStr)
    return jsonStr;
}

const noteStopWords = {
    active: ["rip", "patient transfered out", "do not fill", "transfered out"],
    allergies: ["asked patient for allergies", "reviewed allergies", "no allergies"],
    medicalConditions: ["asked patient for medical conditions", "reviewed medical conditions", "no medical conditions", "med con", "med. con.", "medical conds", "med cons", "reviewed medical"]
}

function searchNotes(notes, searchTerm) {
    const results = notes.map(note => {
        for (let word of words) {
            if (note.includes(word)) {
                return true;
            }
        }
        return false;
    });
    return results;
}

const inactivePrescriptionStatus = ["Expired or No Refills", "Deleted", "Transferred", "Discontinued", "Cancelled"]

// used any time we Need a string to start with a capital letter after a space (names, addresses, etc) 
const normalizeString = string => string.toLowerCase().replace(/\b[a-z]/g, char => char.toUpperCase())

/*
possible improvements for this include checking the rx status for prescriptions that ARE in the database to make sure they are not behind the status of Pioneer (I.E. Application says needs insurance, but insurance is gathered and prescription is in waiting for fill status)
*/

/*
The goal is to create a working queue structure that respects the following schema
queue: {
    patientId: [
        {
            identifier: prescriptionIdentifier,
            billDate: date to bill,
            fillDate: date to fill,
            callDate: date to call,
            deliveryDate: date to deliver,
            expirationDate: date prescription expires,

        }
    ]
}

this allows us to order prescriptions inside their respective arrays on the queue object

all your frontend files need to be able to take in this schema and return valid data to the front end

for call center all prescriptions need to be given a delivery date before they can be routed. 

create a callback queue for call center employees and route prescriptions based on that queue
(notify call center employees 5 minutes before they have a scheduled callback)


////////// UPDATE //////////
queue structure
pharmacy: 
queue: [
    {
        date: new Date(),
        length: len,
        data: {
            patientIdentifier: [prescriptionIdentifier],
            patientIdentifier: [prescriptionIdentifier, prescriptionIdentifier, prescriptionIdentifier]
        }
    }
]

billing: [
    {
        date: new Date(),
        length: len,
        data: {
            patientIdentifier: [prescriptionIdentifier],
            patientIdentifier: [prescriptionIdentifier, prescriptionIdentifier, prescriptionIdentifier]
        }
    }
]

delivery: [
    {
        date: new Date(),
        length: len,
        data: {
            patientIdentifier: [prescriptionIdentifier],
            patientIdentifier: [prescriptionIdentifier, prescriptionIdentifier, prescriptionIdentifier]
        }
    }
]

callCenter: [
    {
        date: new Date(),
        data: {
            English: {
                patientIdentifier: [prescriptionIdentifier]
            },
            Spanish: {
                patientIdentifier: [prescriptionIdentifier]
            }
        }
    }
]

this is not 100% perfect, but it serves the purpouse. 
Because we are taking into account the dates we can now organize and 
sort the arrays based off of the dates that they were placed into the queue


*/

async function uploadData() {
    try {
        const activeIds = await getActiveIds()
        const uniqueIds = await findNonExistingIds(activeIds)
        if (uniqueIds.length > 0) {
            let callChunks = chunkIds(uniqueIds)
            let requestChunks = chunkRequests(callChunks)
            let allResults = []

            for (const chunk of requestChunks) {
                const chunkedPromises = chunk.map(ids => getPioneerData(ids))
                const settledChunk = await Promise.allSettled(chunkedPromises)

                settledChunk.forEach((settledPromise) => {
                    if (settledPromise.status === "fulfilled") {
                        allResults.push(...settledPromise.value)
                    }
                })
            }

            let newPatients = {}
            let newPrescriptions = []
            let queueData = {}
            /* queueData = {
                department_queue: [
                    {
                        date: new Date()
                        data: {
                            customerIdentifier: [prescriptions]
                        }
                    }
                ]
            } */

            for (let i = 0; i < allResults.length; i++) {
                let currentPrescription = allResults[i]
                let fastRunner = 1
                let refills = {}
                let currentRx = currentPrescription.rxNumber
                while (allResults[i + fastRunner] && allResults[i + fastRunner].rxNumber === currentRx) {
                    let refill = allResults[i + fastRunner]
                    let completedDate = refill.completedOn

                    let newRefillObject = {
                        filledBy: refill.filledBy ? normalizeString(refill.filledBy) : null,
                        filledOn: refill.filledOn,
                        checkedBy: refill.checkedBy ? normalizeString(refill.checkedBy) : null,
                        checkedOn: refill.checkedOn,
                        paymentMethod: refill.patientPayMethod,
                        primaryInsurer: refill.primaryInsurer ? normalizeString(refill.primaryInsurer) : null,
                        secondaryInsurer: refill.secondaryInsurer ? normalizeString(refill.secondaryInsurer) : null,
                        dispensedQuantity: refill.dispensedQuantity,
                        daySupplyEnd: refill.daySupplyEndsOn,
                        pharmacist: refill.pharmacist ? normalizeString(refill.pharmacist) : null,
                        ingredientCost: refill.ingredientCost,
                        ingredientCostPaid: refill.ingredientCostPaid,
                        dispensingFee: refill.dispensingFee,
                        dispensingFeePaid: refill.dispensingFeePaid,
                        totalPrice: refill.totalPrice,
                        totalPricePaid: refill.totalPricePaid,
                        patientPaidAmount: refill.patientPaidAmount,
                        netProfit: refill.netProfit,
                        grossProfit: refill.grossProfit,
                        refillNumber: refill.totalRefills - refill.refillsRemaining,
                        refillsRemaining: refill.refillsRemaining,
                        ndc: refill.ndc,
                        fillType: refill.refillOrNew,
                        completedOn: refill.completedOn,
                    }

                    refills[completedDate] = newRefillObject
                    fastRunner++
                }
                i = i + fastRunner - 1

                // stage data
                let rxStatus = inactivePrescriptionStatus.includes(currentPrescription.rxStatus) ? "inactive" : "active"
                let route = dynamicRoutes({ transactionStatus: currentPrescription.rxTransactionStatus, rxStatus, nextFill: currentPrescription.daySupplyEndsOn })

                let prescriptionCriticalComments = currentPrescription.prescriptionCriticalComment ? splitNotes(currentPrescription.prescriptionCriticalComment) : []
                let prescriptionInformationalComments = currentPrescription.prescriptionInformationalComment ? splitNotes(currentPrescription.prescriptionInformationalComment) : []
                let prescriptionNotes = [...prescriptionInformationalComments, ...prescriptionCriticalComments]
                let sortedPrescriptionNotes = sortNotes(prescriptionNotes)

                let needsCounciling = currentPrescription.refillOrNew === "New" && currentPrescription.counceledOn === "null" ? "true" : "false"
                let newPrescription = {
                    identifier: currentPrescription.prescriptionId,
                    rxNumber: currentPrescription.rxNumber,
                    controlledSubstance: currentPrescription.controlled,
                    patient: currentPrescription.patientId,
                    active: rxStatus,
                    department: route.department,
                    queue: route.queue,
                    status: route.status,
                    dispensedQuantity: currentPrescription.dispensedQuantity,
                    name: normalizeString(currentPrescription.prescribedItem),
                    transactionStatus: currentPrescription.rxTransactionStatus,
                    refillOrNew: currentPrescription.refillOrNew,
                    refillsTotal: currentPrescription.totalRefills,
                    refillsRemaining: currentPrescription.refillsRemaining,
                    origin: currentPrescription.origin,
                    directions: currentPrescription.directions,
                    directionsSpanish: currentPrescription.directionsSpanish,
                    notes: sortedPrescriptionNotes,
                    writtenOn: currentPrescription.dateWritten,
                    expiresOn: currentPrescription.expirationDate,
                    counceledOn: currentPrescription.counceledOn,
                    counceledBy: currentPrescription.counceledBy,
                    amountInStock: currentPrescription.amountInStock,
                    strength: currentPrescription.strength,
                    prescriptionType: currentPrescription.prescriptionType,
                    soldOTC: currentPrescription.soldOTC,
                    primaryInsurer: currentPrescription.primaryInsurer,
                    secondaryInsurer: currentPrescription.secondaryInsurer,
                    needsPreCheck: currentPrescription.needsPreCheck,
                    needsCounciling,
                    ndc: currentPrescription.ndc,
                    primaryGroupNumber: currentPrescription.primaryGroupNumber,
                    refillOrNew: currentPrescription.refillOrNew,
                    checkedOn: currentPrescription.checkedOn,
                    checkedBy: currentPrescription.checkedBy,
                    filledOn: currentPrescription.filledOn,
                    filledBy: currentPrescription.filledBy,
                    pharmacy: "valley view",
                    renewedFrom: currentPrescription.renewedFrom,
                    newRenewal: currentPrescription.newRenewal,
                    renewalSentDate: currentPrescription.renewalSentDate,
                    renewalComment: currentPrescription.renewalComment,
                    renewalSentTo: currentPrescription.renewalSentTo,
                    marketerName: currentPrescription.marketerName,
                    completedOn: currentPrescription.completedOn,
                    pharmacist: currentPrescription.pharmacist,
                    primaryClaimMessage: currentPrescription.primaryClaimMessage,
                    secondaryClaimMessage: currentPrescription.secondaryClaimMessage,
                    payMethod: currentPrescription.patientPayMethod,
                    ingredientCost: currentPrescription.ingredientCost,
                    ingredientCostPaid: currentPrescription.ingredientCostPaid,
                    dispensingFee: currentPrescription.dispensingFee,
                    dispensingFeePaid: currentPrescription.dispensingFeePaid,
                    totalPrice: currentPrescription.totalPrice,
                    totalPricePaid: currentPrescription.totalPricePaid,
                    patientPaidAmount: currentPrescription.patientPaidAmount,
                    netProfit: currentPrescription.netProfit,
                    grossProfit: currentPrescription.grossProfit,
                    refills
                }


                let patientCriticalComments = currentPrescription.patientCriticalComment ? splitNotes(currentPrescription.patientCriticalComment) : []
                let patientInforamtionalComments = currentPrescription.patientAdditionalComment ? splitNotes(currentPrescription.patientAdditionalComment) : []
                let patientNotes = [...patientCriticalComments, ...patientInforamtionalComments]
                let sortedPatientNotes = sortNotes(patientNotes)
                let newPatient = {
                    identifier: currentPrescription.patientId,
                    status: currentPrescription.customerStatus,
                    name: currentPrescription.patientName.toLowerCase().replace(/\b[a-z]/g, char => char.toUpperCase()),
                    preferredLanguage: currentPrescription.patientPreferredLanguage || "English",
                    allergies: JSON.parse(currentPrescription.allergies) || [],
                    reviewAllergies: currentPrescription.reviewAllergies,
                    reviewMedicalConditions: currentPrescription.reviewMedicalConditions,
                    gender: currentPrescription.gender,
                    dob: currentPrescription.patientDob ? new Date(currentPrescription.patientDob).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : null,
                    phone: currentPrescription.patientPhone,
                    deliveryPreference: null,
                    addresses: currentPrescription.patientAddresses ? parseSanitizedJSON(currentPrescription.patientAddresses) : null,
                    notes: sortedPatientNotes,
                    prescriber: currentPrescription.prescriber,
                    dea: currentPrescription.prescriberDEA,
                    npi: currentPrescription.prescriberNPI,
                    prescriberAddress: currentPrescription.prescriberAddress ? parseSanitizedJSON(currentPrescription.prescriberAddress) : null,
                    prescriberPhone: currentPrescription.prescriberPhone,
                    prescriberFax: currentPrescription.prescriberFax,
                    activePrescriptions: {},
                    inactivePrescriptions: {},
                    deliveryDate: currentPrescription.deliveryDate ? new Date(currentPrescription.deliveryDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                }

                newPrescriptions.push(newPrescription)

                if (!newPatients[newPatient.identifier]) {
                    newPatients[newPatient.identifier] = newPatient
                }

                let patientData = newPatients[newPatient.identifier]

                if (rxStatus === "inactive") {
                    let inactivePrescriptions = patientData.inactivePrescriptions
                    if (!inactivePrescriptions[newPrescription.rxNumber]) {
                        inactivePrescriptions[newPrescription.rxNumber] = newPrescription.identifier
                    }
                }
                if (rxStatus === "active") {
                    let activePrescriptions = patientData.activePrescriptions
                    if (!activePrescriptions[newPrescription.rxNumber]) {
                        activePrescriptions[newPrescription.rxNumber] = newPrescription.identifier
                    }
                }

                let queueRoute = `${route.department}_${route.queue}`
                let patientIdentifier = newPatient.identifier
                let prescriptionIdentifier = newPrescription.identifier



                if (route.department === "callCenter" && route.queue === "queue") {
                    let preferredLanguage = newPatient.preferredLanguage ? newPatient.preferredLanguage : "English"
                    if (!queueData[queueRoute]) {
                        queueData[queueRoute] = {
                            [preferredLanguage]: {
                                [patientIdentifier]: []
                            }
                        }
                    } else if (!queueData[queueRoute][preferredLanguage]) {
                        queueData[queueRoute][preferredLanguage] = {
                            [patientIdentifier]: []
                        }
                    } else if (!queueData[queueRoute][preferredLanguage][patientIdentifier]) {
                        queueData[queueRoute][preferredLanguage][patientIdentifier] = []
                    }
                    let existingQueueData = queueData[queueRoute][preferredLanguage][patientIdentifier]
                    if (!existingQueueData.includes(prescriptionIdentifier)) {
                        existingQueueData.push(prescriptionIdentifier)
                    }
                } else if (route.department === "pharmacy") {
                    console.log("yes")
                    let pharmacyQueueRoute = `${newPrescription.pharmacy}_${route.queue}`
                    console.log("pharmacyQueueRoute", pharmacyQueueRoute)
                    if (!queueData[pharmacyQueueRoute]) {
                        queueData[pharmacyQueueRoute] = { [patientIdentifier]: [] }

                    } else if (!queueData[pharmacyQueueRoute][patientIdentifier]) {
                        queueData[pharmacyQueueRoute][patientIdentifier] = []
                    }
                    let existingQueueData = queueData[pharmacyQueueRoute][patientIdentifier]
                    if (!existingQueueData.includes(prescriptionIdentifier)) {
                        existingQueueData.push(prescriptionIdentifier)
                    }
                } else if(route.department === null) {
                    // if(route.status === "completed" && route.info === "refills remaining") {
                    //     let lastFilled
                    //     let nextFillDate
                    //     if(currentPrescription.completedOn && currentPrescription.refillsRemaining != 0) {
                    //         let lastFilled = new Date(currentPrescription.completedOn)
                    //         nextFillDate = lastFilled.setDate(lastFilled.getDate() + 25)
                    //     }   
                    // }
                    console.log("yes")
                } else {
                    if (!queueData[queueRoute]) {
                        queueData[queueRoute] = {
                            [patientIdentifier]: []
                        }
                    } else if (!queueData[queueRoute][patientIdentifier]) {
                        queueData[queueRoute][patientIdentifier] = []
                    }
                    let existingQueueData = queueData[queueRoute][patientIdentifier]
                    if (!existingQueueData.includes(prescriptionIdentifier)) {
                        existingQueueData.push(prescriptionIdentifier)
                    }
                }

                if (newPrescription.refillOrNew === "New" && newPrescription.counceledOn === "null") {
                    let queueRoute = `valley view_counciling`
                    if (!queueData[queueRoute]) {
                        queueData[queueRoute] = {
                            [newPatient.identifier]: []
                        }
                    } else if (!queueData[queueRoute][newPatient.identifier]) {
                        queueData[queueRoute][newPatient.identifier] = []
                    }
                    let existingQueueData = queueData[queueRoute][newPatient.identifier]
                    if (!existingQueueData.includes(prescriptionIdentifier)) {
                        existingQueueData.push(prescriptionIdentifier)
                    }
                }

            }

            await updateOrInsertPatients(newPatients)
            console.log("patients updated successfully")
            await updateOrInsertPrescriptions(newPrescriptions)
            console.log("prescriptions updated successfully")
            const departmentAndQueues = Object.keys(queueData)
            console.log("departmentAndQueues", departmentAndQueues)
            for (let i = 0; i < departmentAndQueues.length; i++) {
                let departmentAndQueue = departmentAndQueues[i]
                const [department, queue] = departmentAndQueue.split("_")
                let data = {
                    department,
                    queue,
                    newData: queueData[departmentAndQueue]
                }
                await uploadQueueData(data)
            }
            return "upload algorithm ran successfully"

        } else {
            return "no new items found"
        }

    } catch (err) {
        throw err
    }
}


module.exports = { uploadData }


