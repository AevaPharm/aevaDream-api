const Queue = require("../models/departmentQueueModel")
const Employee = require("../models/employeeModel")
const Patient = require("../models/patientModel")
const Prescription = require("../models/prescriptionModel")
const { encrypt, decrypt } = require("./encryption.js")
const mongoose = require("mongoose")

const getDepartmentQueues = async (req, res) => {
    const { department } = req.body
    let departmentQueueData = await Queue.findOne({ department, isUpdating: false }).exec()
    if (!departmentQueueData) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return getDepartmentQueues(req, res)
    }
    return res.status(200).json({ queues: departmentQueueData.queues })
}

const getDepartmentQueue = async (req, res, next) => {
    try {
        const { department, queue, date } = req.body
        let departmentQueueData = await Queue.findOne({ department, isUpdating: false })
        if (!departmentQueueData) {
            await new Promise(resolve => setTimeout(resolve, 300))
            return getDepartmentQueue(req, res, next)
        }
        let queueData = departmentQueueData.queues[queue]
        const relevantQueues = queueData.filter(q => new Date(q.date) <= new Date(date))
        let fetchedDepartmentQueue = []
        for (let i = 0; i < relevantQueues.length; i++) {
            let currentQueue = relevantQueues[i]
            let date = currentQueue.date
            let data = currentQueue.queueData
            let patients = Object.keys(data)
            for (const patient of patients) {
                let patientData = await Patient.findOne({ identifier: patient }).exec()
                let prescriptions = await Prescription.find({ identifier: { $in: data[patient] } })
                let queueItem = {
                    ...patientData._doc,
                    date,
                    prescriptions
                }
                fetchedDepartmentQueue.push(queueItem)
            }
        }
        return res.status(200).json({ success: "department queue fetched successfully", queue: fetchedDepartmentQueue })
    } catch (err) {
        next(err)
    }
}

// const assignCallQueue = async (req, res, next) => {
//     const { id } = req.body
//     const day = new Date().getDay().toString()

//     try {
//         let employee = await Employee.findById(id)
//         if (!employee) {
//             return res.status(404).json({ error: "employee not found. Please try logging out and back in" })
//         }
//         let employeeQueue = employee.profileData.queues.queue
//         let employeeQueueLength = employeeQueue.length
//         console.log(`Employee's current queue length: ${employeeQueueLength}`)

//         let languages = employee.profileData.languages
//         let initialAssignLimit = 50 - employeeQueueLength

//         if (initialAssignLimit <= 0) {
//             return res.status(200).json({ warning: "Existing queue is already above the ideal aggregation threshold"});
//         }
//         let queueData = await Queue.findOneAndUpdate({ department: "callCenter", isUpdating: false }, { isUpdating: true }, { new: true })
//         if (!queueData) {
//             await new Promise(resolve => setTimeout(resolve, 300));
//             return assignCallQueue(req, res, next)
//         }
//         let employeeDayCount = queueData.employeeCounts[day]
//         let existingDepartmentQueue = queueData.queues.queue

//         let dailyQueueDemand = Object.keys(existingDepartmentQueue["English"]).length / employeeDayCount
//         dailyQueueDemand = dailyQueueDemand > 50 ? 50 : dailyQueueDemand
//         let totalToAssign = dailyQueueDemand - employeeQueueLength

//         let newQueueItems = []

//         if (totalToAssign <= 0) {
//             queueData.isUpdating = false
//             await queueData.save()
//             return res.status(200).json({ warning: "Existing queue is already above the aggregation threshold"})
//         }

//         if (languages.length > 1) {
//             languages = languages.filter(language => language != "English")
//             languages.push("English")
//         }

//         console.log(`Languages for assignment: ${languages}`)

//         let currentLanguageIndex = 0
//         while (newQueueItems.length < totalToAssign && currentLanguageIndex < languages.length) {

//             let currentLanguageQueue = existingDepartmentQueue[languages[currentLanguageIndex]]

//             while (newQueueItems.length < totalToAssign && Object.keys(currentLanguageQueue).length > 0) {
//                 let patientIdentifiers = Object.keys(currentLanguageQueue)
//                 let patient = patientIdentifiers[0]
//                 let prescriptionIdentifiers = currentLanguageQueue[patient]

//                 let newQueueObj = {
//                     patient: patient,
//                     prescriptions: prescriptionIdentifiers
//                 }

//                 newQueueItems.push(newQueueObj)
//                 Reflect.deleteProperty(currentLanguageQueue, patient)
//             }

//             currentLanguageIndex++; // Ensuring the loop progresses.
//         }
//         const newQueueData = []
//         for (let i = 0; i < newQueueItems.length; i++) {
//             let current = newQueueItems[i]
//             let patientData = await Patient.findOne({ identifier: current.patient }).exec()
//             if (patientData) {
//                 let prescriptions = await Prescription.find({ identifier: { $in: current.prescriptions } })
//                 let queueItem = {
//                     ...patientData._doc,
//                     prescriptions
//                 };
//                 newQueueData.push(queueItem)
//             }
//         }
//         employeeQueue = [...employeeQueue, ...newQueueData]
//         employee.markModified("profileData.queues.queue")
//         await employee.save()

//         queueData.isUpdating = false
//         queueData.markModified("queues.queue")
//         await queueData.save()
//         return res.status(200).json({ success: "new queue data assigned successfully", queue: newQueueData })
//     } catch (err) {
//         next(err)
//     }
// }

const getRelevantQueues = (queueData, today) => queueData.filter(q => q.date <= today);

const getQueueItemsToAssign = (queue, totalToAssign, languages) => {
    let newQueueItems = [];
    let currentLanguageIndex = 0;

    while (newQueueItems.length < totalToAssign && currentLanguageIndex < languages.length) {
        let currentLanguageQueue = queue[languages[currentLanguageIndex]] || {};
        let patientIdentifiers = Object.keys(currentLanguageQueue);

        for (let patient of patientIdentifiers) {
            if (newQueueItems.length >= totalToAssign) break;
            let newQueueObj = {
                patient: patient,
                prescriptions: currentLanguageQueue[patient]
            };
            newQueueItems.push(newQueueObj);
            Reflect.deleteProperty(currentLanguageQueue, patient);
        }
        currentLanguageIndex++;
    }
}


// const assignCallQueue = async (req, res, next) => {
//     const { id } = req.body;
//     const today = new Date().toISOString().slice(0, 10);

//     console.log("Function assignCallQueue entered:", { id, today });

//     try {
//         console.log("Fetching employee and queueData...");
//         const [employee, queueData] = await Promise.all([
//             Employee.findById(id),
//             Queue.findOneAndUpdate(
//                 { department: "callCenter", isUpdating: false },
//                 { isUpdating: true },
//                 { new: true }
//             )
//         ]);
//         console.log("Employee and queueData fetched:", { employee, queueData });

//         if (!employee) return res.status(404).json({ error: "Employee not found. Please try logging out and back in" });
//         if (!queueData) {
//             console.log("No queueData found, waiting 300ms and retrying...");
//             await new Promise(resolve => setTimeout(resolve, 300));
//             return assignCallQueue(req, res, next);
//         }

//         // filter the queues to only include the entries up to today
//         let relevantQueues = getRelevantQueues(queueData.queues.queue, today)
//         let existingDepartmentQueue = relevantQueues.length > 0 ? relevantQueues[0].data : {};
//         let dailyQueueDemand = Math.min(50, Object.keys(existingDepartmentQueue["English"] || {}).length / queueData.employeeCounts[today]);
//         console.log("Daily queue demand calculated as:", dailyQueueDemand);
//         let totalToAssign = dailyQueueDemand - employee.profileData.queues.queue.length;
//         console.log("Total items to assign:", totalToAssign);

//         if (totalToAssign <= 0) {
//             console.log("Total to assign <= 0, exiting...");
//             queueData.isUpdating = false;
//             await queueData.save();
//             return res.status(200).json({ warning: "Existing queue is already above the aggregation threshold" });
//         }

//         let languages = [...new Set([...employee.profileData.languages, "English"])];
//         console.log("Languages identified:", languages);

//         let newQueueItems = getQueueItemsToAssign(existingDepartmentQueue, totalToAssign, languages);
//         console.log("New queue items to assign:", newQueueItems);

//         // Fetching new queue data
//         const newQueueData = await Promise.all(newQueueItems.map(async item => {
//             console.log("Fetching patient and prescription data for item:", item);
//             let patientData = await Patient.findOne({ identifier: item.patient }).exec();
//             if (patientData) {
//                 let prescriptions = await Prescription.find({ identifier: { $in: item.prescriptions } });
//                 return {
//                     ...patientData._doc,
//                     prescriptions
//                 };
//             }
//             console.log("No patient data found for item:", item);
//             return null;
//         }));

//         // Update employee and queue data
//         console.log("Updating employee and queue data...");
//         employee.profileData.queues.queue = [...employee.profileData.queues.queue, ...newQueueData];
//         queueData.isUpdating = false;

//         await Promise.all([
//             employee.save(),
//             queueData.save()
//         ]);

//         console.log("Employee and queue data saved successfully.");
//         return res.status(200).json({ success: "New queue data assigned successfully", queue: newQueueData });

//     } catch (err) {
//         console.error("Error caught in assignCallQueue:", err);
//         next(err);
//     }
// }

async function abortTransactionAndEndSession(session) {
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    session.endSession();
}

const assignCallQueue = async (req, res, next) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const { id } = req.body
        const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        const day = new Date().getDay()
        const [employee, queueData] = await Promise.all([
            Employee.findById(id),
            Queue.findOneAndUpdate(
                { department: "callCenter", isUpdating: false },
                { isUpdating: true },
                { new: true }
            ).session(session)
        ])

        let retryCount = 10
        while (!queueData && retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 300))
            retryCount -= 1
            if (retryCount > 0) {
                return assignCallQueue(req, res, next)
            }
        }

        if(!employee) {
            await abortTransactionAndEndSession(session)
            return res.status(404).json({ error: "Employee not found. Try logging out and logging back in" })
        }

        const queue = queueData.queues.queue
        if (queue.length === 0) {
            return res.status(200).json({ message: "Queue is empty" })
        }
        const relevantQueues = queue.filter(q => new Date(q.date) <= new Date(today))
        if (relevantQueues.length === 0) {
            await abortTransactionAndEndSession(session)
            return res.status(200).json({ message: "No matching items in the queue" })
        }
        let totalEnglishLength = relevantQueues.reduce((acc, curr) => {
            if (!curr.data || !curr.data["English"]) {
                return acc  // return the accumulator unchanged
            }
            return acc + Object.keys(curr.data["English"]).length;
        }, 0)
        const dailyQueueDemand = Math.min(totalEnglishLength / Number(queueData.employeeCounts[day]))
        const ideal = 50
        const existingEmployeeQueue = employee.profileData?.queues?.queue || []
        let totalToAssign = (dailyQueueDemand > ideal)
            ? ideal - existingEmployeeQueue.length
            : dailyQueueDemand - existingEmployeeQueue.length
        if (totalToAssign <= 0) {
            await abortTransactionAndEndSession(session)
            return res.status(200).json({ warning: "Existing queue is already above the aggregation threshold" })
        }
        let newQueueData = []
        let languagesFluent = employee.profileData.languages
        if(languagesFluent.length > 1) {
            languagesFluent = languagesFluent.filter(lang => lang !== "English")
            languagesFluent.push("English")
        }
        for (const language of languagesFluent) {
            if(newQueueData.length >= totalToAssign) break
            for(const currentQueue of relevantQueues) {
                if (newQueueData.length >= totalToAssign) break
                if(!currentQueue.data[language]) continue

                const patients = Object.keys(currentQueue.data[language])
                const patientPromises = patients.map(async (currentPatient) => {
                    try {
                        const prescriptionIdentifiers = currentQueue.data[language][currentPatient]
                        const patientData = await Patient.findOne({identifier: currentPatient})
                        const prescriptions = await Prescription.find({identifier: {$in: prescriptionIdentifiers}})
                        return {...patientData._doc, prescriptions}
                    } catch(err) {
                        return null
                    }
                })
                const resolvedPatientData = (await Promise.all(patientPromises)).filter(patient => patient !== null)
                newQueueData.push(...resolvedPatientData.slice(0, totalToAssign - newQueueData.length))
                patients.slice(0, totalToAssign - newQueueData.length).forEach(patientIdentifier => {
                    delete currentQueue.data[language][patientIdentifier]
                })

                if (Object.keys(currentQueue.data[language]).length === 0) {
                    delete currentQueue.data[language];
                }
            }
            queueData.queues.queue = queueData.queues.queue.filter(q => Object.keys(q.data).length > 0)
        }

        employee.profileData.queues.queue = [...existingEmployeeQueue, ...newQueueData]
        employee.markModified("profileData.queues.queue")
        await employee.save({ session })

        queueData.markModified("queues.queue")
        queueData.isUpdating = false
        await queueData.save({ session })
        await session.commitTransaction()
        session.endSession()

        return res.status(200).json({ queue: newQueueData })

    } catch (err) {
        console.error('Error caught:', err)
        await session.abortTransaction()
        session.endSession()
        next(err)
    }
}

const assignBillingQueue = async (req, res, next) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const { id } = req.body;
        const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        const day = new Date().getDay()
        const [employee, queueData] = await Promise.all([
            Employee.findById(id),
            Queue.findOneAndUpdate(
                { department: "billing", isUpdating: false },
                { isUpdating: true },
                { new: true }
            ).session(session)
        ])

        let retryCount = 10
        while (!queueData && retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 300))
            retryCount -= 1
            if (retryCount > 0) {
                return assignBillingQueue(req, res, next)
            }
        }

        if (!employee) {
            await abortTransactionAndEndSession(session)
            return res.status(404).json({ error: "Employee not found. Try logging out and logging back in" })
        }

        const queue = queueData.queues.queue
        if (queue.length === 0) {
            await abortTransactionAndEndSession(session)
            return res.status(200).json({ message: "Queue is empty" })
        }
        const relevantQueues = queue.filter(q => new Date(q.date) <= new Date(today))
        if (relevantQueues.length === 0) {
            await abortTransactionAndEndSession(session)
            return res.status(200).json({ message: "No matching items in the queue" })
        }
        const totalLength = relevantQueues.reduce((acc, cur) => acc + Object.keys(cur.data).length, 0)

        const dailyQueueDemand = Math.min(totalLength / Number(queueData.employeeCounts[day]))
        const ideal = 50
        const existingEmployeeQueue = employee.profileData?.queues?.queue || []

        let totalToAssign = (dailyQueueDemand > ideal)
            ? ideal - existingEmployeeQueue.length
            : dailyQueueDemand - existingEmployeeQueue.length

        if (totalToAssign <= 0) {
            await abortTransactionAndEndSession(session)
            return res.status(200).json({ warning: "Existing queue is already above the aggregation threshold" })
        }

        let newQueueData = []
        for (const currentQueue of relevantQueues) {
            if (newQueueData.length >= totalToAssign) break

            const patients = Object.keys(currentQueue.data)
            const patientPromises = patients.map(async (currentPatient) => {
                try {
                    const prescriptionIdentifiers = currentQueue.data[currentPatient]
                    const patientData = await Patient.findOne({ identifier: currentPatient }).exec()
                    const prescriptions = await Prescription.find({ identifier: { $in: prescriptionIdentifiers } })
                    return { ...patientData._doc, prescriptions }
                } catch (err) {
                    return null
                }
            })

            const resolvedPatientData = (await Promise.all(patientPromises)).filter(patient => patient !== null)
            newQueueData.push(...resolvedPatientData.slice(0, totalToAssign - newQueueData.length))
            patients.slice(0, totalToAssign - newQueueData.length).forEach(patientIdentifier => {
                delete currentQueue.data[patientIdentifier];
            })
        }
        queueData.queues.queue = queueData.queues.queue.filter(q => Object.keys(q.data).length > 0)
        employee.profileData.queues.queue = [...existingEmployeeQueue, ...newQueueData]
        employee.markModified("profileData.queues.queue")
        await employee.save({ session })

        queueData.markModified("queues.queue")
        queueData.isUpdating = false
        await queueData.save({ session })
        await session.commitTransaction()
        session.endSession()

        return res.status(200).json({ queue: newQueueData })
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        next(err)
    }
}

function insertItemIntoArray(array, newItem) {
    const newItemDate = new Date(newItem.date)
    if (isNaN(newItemDate)) throw new Error('Invalid date in newItem')
    if (array.length > 0) {
        const insertIndex = array.findIndex(item => {
            const itemDate = new Date(item.date)
            return itemDate > newItemDate
        })
        if (insertIndex === -1) {
            array.push(newItem)
        } else {
            array.splice(insertIndex, 0, newItem)
        }
    } else {
        array.push(newItem)
    }

    return array
}

const addToQueue = async (req, res, next) => {
    let { patientIdentifier, prescriptions, department, queue, date } = req.body
    try {
        const departmentQueueData = await Queue.findOneAndUpdate({ department, isUpdating: false }, { isUpdating: true }, { new: true })
        if (!departmentQueueData) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return addToQueue(req, res, next);
        }
        let queueData = departmentQueueData.queues[queue]
        let existingQueueIndex = queueData.findIndex(q => q.date === date)

        let preferredLanguage
        if (department === "callCenter" && queue === "queue") {
            let patientInfo = await Patient.findOne({ identifier: patientIdentifier })
            preferredLanguage = patientInfo.preferredLanguage || "English"
        }
        if (existingQueueIndex === -1) {
            let newQueueItem
            if (department === "callCenter" && queue === "queue") {
                newQueueItem = {
                    date,
                    data: {
                        [preferredLanguage]: {
                            [patientIdentifier]: [...prescriptions]
                        }
                    }
                }
            } else {
                newQueueItem = {
                    date,
                    data: {
                        [patientIdentifier]: [...prescriptions]
                    }
                }
            }
            let updatedQueue = insertItemIntoArray(queueData, newQueueItem)
            queueData = updatedQueue
            departmentQueueData.markModified(`queues.${queue}`)
            departmentQueueData.isUpdating = false
            await departmentQueueData.save()
            return res.status(200).json({ success: "prescription added to queue" })
        } else {
            let queueItem = queueData[existingQueueIndex]
            let patientsAndPrescriptions
            if (preferredLanguage) {
                patientsAndPrescriptions = queueItem.data[preferredLanguage] || {}
            } else {
                patientsAndPrescriptions = queueItem.data
            }
            if (!patientsAndPrescriptions[patientIdentifier]) {
                patientsAndPrescriptions[patientIdentifier] = [...prescriptions]
            } else {
                let patientPrescriptions = new Set(patientsAndPrescriptions[patientIdentifier])
                prescriptions.forEach(prescription => patientPrescriptions.add(prescription))
                patientsAndPrescriptions[patientIdentifier] = [...patientPrescriptions]
            }
            queueData[existingQueueIndex].data = patientsAndPrescriptions
            departmentQueueData.markModified(`queues.${queue}`)
            departmentQueueData.isUpdating = false
            await departmentQueueData.save()
            return res.status(200).json({ success: "prescription added to queue" })
        }
    } catch (err) {
        await Queue.findOneAndUpdate({ department }, { isUpdating: false }).exec()
        next(err)
    }
}

// const addToQueue = async (req, res, next) => {
//     let { patientIdentifier, prescriptions, department, queue, date } = req.body;

//     console.log('addToQueue Function Initiated with data:', {patientIdentifier, prescriptions, department, queue, date});

//     try {
//         const departmentQueueData = await Queue.findOneAndUpdate(
//             { department, isUpdating: false },
//             { isUpdating: true },
//             { new: true }
//         );

//         console.log('Department Queue Data:', departmentQueueData)

//         if (!departmentQueueData) {
//             console.log('No departmentQueueData, retrying...')

//             await new Promise(resolve => setTimeout(resolve, 300))
//             return addToQueue(req, res, next)
//         }

//         let queueData = departmentQueueData.queues[queue]
//         console.log('Queue Data:', queueData)

//         let existingQueueIndex = queueData.findIndex(q => new Date(q.date) === new Date(date)) // Changed from `new Date(today)` to `new Date(date)` to match the input

//         console.log('Existing Queue Index:', existingQueueIndex)

//         let preferredLanguage

//         if (department === "callCenter" && queue === "queue") {
//             let patientInfo = await Patient.findOne({ identifier: patientIdentifier })
//             console.log('Patient Info:', patientInfo)

//             preferredLanguage = patientInfo.preferredLanguage || "English"
//             console.log('Preferred Language:', preferredLanguage)
//         }

//         if (existingQueueIndex === -1) {
//             console.log('Creating a new Queue Item...')

//             let newQueueItem

//             if (department === "callCenter" && queue === "queue") {
//                 newQueueItem = {
//                     date,
//                     data: {
//                         [preferredLanguage]: {
//                             [patientIdentifier]: [...prescriptions]
//                         }
//                     }
//                 }
//             } else {
//                 newQueueItem = {
//                     date,
//                     data: {
//                         [patientIdentifier]: [...prescriptions]
//                     }
//                 }
//             }

//             console.log('New Queue Item:', newQueueItem)

//             let updatedQueue = insertItemIntoArray(queueData, newQueueItem) // Ensure `insertItemIntoArray` is defined
//             queueData = updatedQueue

//             console.log('Updated Queue:', updatedQueue)

//             departmentQueueData.markModified(`queues.${queue}`)
//             departmentQueueData.isUpdating = false
//             await departmentQueueData.save()

//             console.log('New queue item added successfully.')

//             return res.status(200).json({success: "prescription added to queue"})
//         } else {
//             console.log('Updating an existing Queue Item...')

//             let queueItem = queueData[existingQueueIndex]
//             let patientsAndPrescriptions

//             if (preferredLanguage) {
//                 patientsAndPrescriptions = queueItem.data[preferredLanguage] || {}
//             } else {
//                 patientsAndPrescriptions = queueItem.data
//             }

//             console.log('Patients and Prescriptions before update:', patientsAndPrescriptions)

//             if (!patientsAndPrescriptions[patientIdentifier]) {
//                 patientsAndPrescriptions[patientIdentifier] = [...prescriptions]
//             } else {
//                 let patientPrescriptions = new Set(patientsAndPrescriptions[patientIdentifier])
//                 prescriptions.forEach(prescription => patientPrescriptions.add(prescription))
//                 patientsAndPrescriptions[patientIdentifier] = [...patientPrescriptions]
//             }

//             console.log('Patients and Prescriptions after update:', patientsAndPrescriptions)

//             queueData[existingQueueIndex] = patientsAndPrescriptions // This line might be updating improperly. Perhaps you meant queueData[existingQueueIndex].data = patientsAndPrescriptions;

//             departmentQueueData.markModified(`queues.${queue}`)
//             departmentQueueData.isUpdating = false
//             await departmentQueueData.save()

//             console.log('Existing queue item updated successfully.')

//             return res.status(200).json({success: "prescription added to queue"})
//         }
//     } catch(err) {
//         console.error('Error occurred:', err)

//         await Queue.findOneAndUpdate({department}, {isUpdating: false}).exec()

//         next(err)
//     }
// }


const countQueue = async (req, res, next) => {
    let { department, queue, language } = req.body
    try {
        let departmentQueueData = await Queue.findOne({ department })
        let queueData = departmentQueueData.queues.queue
        let length
        if (department === "callCenter" && queue === "queue") {
            let languageQueue = queueData[language]
            length = Object.keys(languageQueue).length
        } else {
            length = Object.keys(queueData).length
        }

        return res.status(200).json({ success: `The ${department}'s ${queue} is ${length} long` })

    } catch (err) {
        next(err)
    }
}

// const removeFromQueue = async (req, res, next) => {
//     let { prescriptionIdentifiers, patientIdentifier, department, queue } = req.body
//     try {
//         let departmentQueueData = await Queue.findOneAndUpdate({ department, isUpdating: false }, { isUpdating: true }, { new: true })
//         if (!departmentQueueData) {
//             await new Promise(resolve => setTimeout(resolve, 300))
//             return removeFromQueue(req, res, next)
//         }
//         let preferredLanguage
//         if (department === "callCenter" && queue === "queue") {
//             let patientData = await Patient.findOne({ identifier: patientIdentifier }).select("preferredLanguage")
//             preferredLanguage = patientData.preferredLanguage
//         }
//         let queueData = preferredLanguage ? departmentQueueData.queues[queue][preferredLanguage] : departmentQueueData.queues[queue]
//         let queuePrescriptions = queueData[patientIdentifier]
//         if (queuePrescriptions) {
//             for (let i = 0; i < prescriptionIdentifiers.length; i++) {
//                 let prescription = prescriptionIdentifiers[i]
//                 let index = queuePrescriptions.indexOf(prescription)
//                 if (index !== -1) {
//                     queuePrescriptions.splice(index, 1)
//                 }
//             }
//             if (queuePrescriptions.length === 0) {
//                 Reflect.deleteProperty(queueData, patientIdentifier)
//             }
//             departmentQueueData.markModified(`queues.${queue}`)
//             departmentQueueData.isUpdating = false
//             await departmentQueueData.save()
//             return res.status(200).json({ success: "queue updated" })
//         } else {
//             departmentQueueData.isUpdating = false
//             await departmentQueueData.save()
//             return res.status(404).json({ error: "patient does not exist on the queue" })
//         }
//     } catch (err) {
//         next(err)
//     }
// }
const removeFromQueue = async (req, res, next) => {
    let { prescriptionIdentifiers, patientIdentifier, department, queue, date } = req.body
    try {
        let departmentQueueData = await Queue.findOneAndUpdate({ department, isUpdating: false }, { isUpdating: true }, { new: true })
        if (!departmentQueueData) {
            await new Promise(resolve => setTimeout(resolve, 300))
            return removeFromQueue(req, res, next)
        }
        let preferredLanguage
        if (department === "callCenter" && queue === "queue") {
            let patientData = await Patient.findOne({ identifier: patientIdentifier })
            preferredLanguage = patientData.preferredLanguage
        }

        let existingQueueIndex = departmentQueueData.queues[queue].findIndex(q => q.date === date)

        if (existingQueueIndex === -1) {
            departmentQueueData.isUpdating = false
            await departmentQueueData.save()
            return res.status(404).json({ error: "No queue found for today's date." })
        }

        let queueData = preferredLanguage ? departmentQueueData.queues[queue][existingQueueIndex].data[preferredLanguage] : departmentQueueData.queues[queue][existingQueueIndex].data
        let queuePrescriptions = queueData[patientIdentifier]

        if (queuePrescriptions) {
            for (let prescription of prescriptionIdentifiers) {
                let index = queuePrescriptions.indexOf(prescription)
                if (index !== -1) {
                    queuePrescriptions.splice(index, 1)
                }
            }

            if (queuePrescriptions.length === 0) {
                Reflect.deleteProperty(queueData, patientIdentifier)
            }

            if (Object.keys(queueData).length === 0) {
                departmentQueueData.queues[queue].splice(existingQueueIndex, 1)
            }

            departmentQueueData.markModified(`queues.${queue}`)
            departmentQueueData.isUpdating = false
            await departmentQueueData.save()

            return res.status(200).json({ success: "Queue updated" })

        } else {
            departmentQueueData.isUpdating = false
            await departmentQueueData.save()
            return res.status(404).json({ error: "Patient does not exist on the queue" })
        }

    } catch (err) {
        next(err);
    }
}

const createDepartmentQueue = async (req, res) => {
    const { department, queues, employeeCounts } = req.body
    let queueObject = {
        queues: queues,
        department,
        isUpdating: false,
        employeeCounts
    }
    try {
        const newQueue = new Queue(queueObject)
        await newQueue.save()
        const savedQueue = await Queue.findOne({ department });
        return res.status(200).json({ success: "queue created successfully" })

    } catch (err) {
        return res.status(400).json({ err })
    }
}

// 


const clearQueueStatus = async (req, res) => {
    let updated = await Queue.findOneAndUpdate({ isUpdating: true }, { isUpdating: false }, { new: true })
    if (updated) {
        return res.status(200).json({ success: "upaded" })
    } else {
        return res.status(400).json({ error: "nothing was updated" })
    }
}

const addNewQueue = async (req, res, next) => {
    const { department, newQueue } = req.body
    try {
        let queueData = await Queue.findOne({ department }).exec()
        let queues = queueData.queues
        queues[newQueue] = {}
        await queueData.save()
        return res.status(200).json({ success: `Queue: ${newQueue} has been added successfully` })
    } catch (err) {
        next(err)
    }
}

module.exports = {
    addNewQueue,
    assignCallQueue,
    assignBillingQueue,
    createDepartmentQueue,
    addToQueue,
    countQueue,
    removeFromQueue,
    clearQueueStatus,
    getDepartmentQueues,
    getDepartmentQueue
}