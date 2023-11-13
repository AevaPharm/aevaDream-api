const mongoose = require("mongoose")
const jwt = require('jsonwebtoken')
const Employee = require("../models/employeeModel")
const Queue = require("../models/departmentQueueModel")
const { hashPassword, validataAuth } = require("./encryption.js")
const defaultProfileImage = require("./defaultProfileImage")

// redo this
// const uploadProfilePhoto = (req, res) => {
//     let id = req.params.id
//     upload.single('profilePhoto')(req, res, async function (err) {
//         let newProfileImage = req.file.path
//         console.log(id)
//         if (err) {
//             return res.status(400).send('Error while uploading file. Try again later.');
//         }
//         try {
//             if (verifyId(id)) {
//                 const employee = await Employee.findById(id)
//                 let profileData = JSON.parse(decrypt(employee.profileData, "employee"))
//                 console.log("new image", newProfileImage)
//                 profileData.profilePhoto = newProfileImage
//                 console.log("updated profile data", profileData)
//                 encryptedProfileData = encrypt(JSON.stringify(profileData), "employee")
//                 employee.profileData = encryptedProfileData
//                 await employee.save()
//                 res.status(200).send({ success: "image uploaded successfully", image: newProfileImage })
//             }
//         } catch (err) {
//             res.status(400).send({ error: "Could not update the profile image" })
//         }
//     })
// }

const registerNewUser = async (req, res, next) => {
    const { employee } = req.body
    let defaultImage = defaultProfileImage
    let queues
    if (employee.department === "callCenter") {
        queues = {
            queue: [],
            callbacks: [],
            deliveryProblems: [],
        }
    } else if (employee.department === "billing") {
        queues = {
            queue: [],
            failedAudit: []
        }
    } else if (employee.department === "pharmacist") {
        queues = {
            counciling: [],
            pendingOpioid: [],
            queue: []
        }
    } else if (employee.department === "delivery") {
        queues = {
            pickedUp: [],
            delivered: [],
            deliveryProblems: [],
        }
    }

    let profileData = {
        ...employee.profileData,
        resetToken: null,
        extension: "0000",
        IPAddressWhitelist: [],
        locked: false,
        numLoginAttempts: 0,
        resetAttempts: 0,
        resetToken: null,
        role: employee.role,
        profilePhoto: employee.profileData.profilePhoto ? employee.profileData.profilePhoto : defaultImage,
        preferences: {
            sidebarBackgroundImage: true,
            sidebarMini: false,
            fixedNavbar: true,
            filterColor: null,
            sidebarImage: null,
            lockScreenImage: null,
        },
        queues: queues ? queues : {},
        notifications: [],
        languages: employee.languages ? employee.languages : ["english"],
        workSchedule: employee.workSchedule ? employee.workSchedule : {},
        hireDate: "",
    }
    const hashedPassword = await hashPassword(employee.password)
    const hashedPin = await hashPassword(employee.pin)
    let employeeObj = {
        email: employee.email,
        password: hashedPassword,
        pin: hashedPin,
        loggedIn: false,
        active: true,
        department: employee.department,
        profileData
    }
    Employee.create(employeeObj, (err, doc) => {
        if (err) {
            return res.status(500).json(err)
        }
        return res.status(200).json({ success: "New Employee Created Sucessfully! 🥳" })
    })
}

const login = async (req, res, next) => {
    const { email, password, pin, ipAddress } = req.body

    try {
        let employee = await Employee.findOne({ email }).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        const validPassword = await validataAuth(password, employee.password)
        const validPin = await validataAuth(pin, employee.pin)
        let profileData = employee.profileData
        if (validPassword && validPin) {
            if (profileData.role !== "inactive" && !profileData.locked) {
                profileData.numLoginAttempts = 0
                profileData.locked = false
                employee.loggedIn = true
                await employee.save()
                const token = jwt.sign({ _id: employee._id }, process.env.PASSWORD_HASH, { expiresIn: "12h" })
                res.cookie("token", token, { httpOnly: true })
                return res.status(200).json({ id: employee._id, email: employee.email, department: employee.department, profileData })
            } else if (profileData.role === "inactive") {
                return res.status(401).json({ error: "Employee has been marked as inactive." })
            } else {
                return res.status(401).json({ locked: true, error: "your account has been locked due to too many unsuccessful signin attempts. You must reset your password to continue logging in." })
            }
        } else {
            profileData.numLoginAttempts += 1
            if (profileData.numLoginAttempts >= 5) {
                profileData.locked = true
            }
            await employee.save()
            if (profileData.locked) {
                return res.status(401).json({ locked: true, error: "your account has been locked due to too many unsuccessful signin attempts. You must reset your password to continue logging in." })
            } else {
                return res.status(401).json({ error: `Your password or pin was entered incorrectly. You have ${5 - profileData.numLoginAttempts} attempts left until your account is locked.` })
            }
        }

    } catch (err) {
        next(err)
    }
}


const logout = (req, res, next) => {
    const { id } = req.body
    Employee.updateOne({ _id: id }, { loggedIn: false }, (err, doc) => {
        if (err) {
            return res.status(400).json(err)
        } else if (!doc) {
            return res.status(403).json({ error: "Unable to log out" })
        }
        res.clearCookie("token")
        return res.status(200).json({ success: "You have been logged out successfully" })
    })
}

// unlock - setting the application to locked is done through redux
const unlockApp = async (req, res, next) => {
    const { id, pin } = req.body
    try {
        let employee = Employee.findById(id).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        let pinVerified = await validataAuth(pin, employee.pin)
        if (pinVerified) {
            return res.status(200).json({ redirect: true, success: "Welcome Back!🥳" })
        }
        return res.status(401).json({ redirect: false, error: "Incorrect Pin 😟" })
    } catch (err) {
        next(err)
    }

}

const getQueues = async (req, res, next) => {
    let { id } = req.body
    try {
        let employee = await Employee.findById(id, 'profileData.queues').exec()
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" })
        }
        return res.status(200).json({ success: true, queues: employee.profileData.queues })
    } catch (err) {
        next(err)
    }
}

const getQueue = async (req, res, next) => {
    let { id, queue } = req.body
    try {
        let employee = await Employee.findById(id, `profileData.queues.${queue}`).exec()
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" })
        }
        if (!employee.profileData.queues[queue]) {
            return res.status(404).json({ error: "Queue not found for the given employee" });
        }
        return res.status(200).json({ success: true, queue: employee.profileData.queues[queue] })
    } catch (err) {
        next(err)
    }
}

const dropQueues = async (req, res, next) => {
    const { id } = req.body
    try {
        let employee = await Employee.findById(id)
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        let queues
        if (employee.department === "callCenter") {
            queues = {
                queue: [],
                callbacks: [],
                deliveryProblems: [],
            }
        } else if (employee.department === "billing") {
            queues = {
                queue: [],
                failedAudit: []
            }
        } else if (employee.department === "pharmacist") {
            queues = {
                counciling: [],
                pendingOpioid: [],
                queue: []
            }
        } else if (employee.department === "delivery") {
            queues = {
                pickedUp: [],
                delivered: [],
                deliveryProblems: [],
            }
        }
        employee.profileData.queues = queues
        employee.markModified('profileData.queues')
        await employee.save()
        return res.status(200).json({ success: "employee's queues have been cleared" })

    } catch (err) {
        next(err)
    }
}

const replaceQueue = async (req, res, next) => {
    let { id, selectedQueue, updatedQueue } = req.body
    try {
        const employee = await Employee.findByIdAndUpdate(id, { [`profileData.queues.${selectedQueue}`]: updatedQueue })
        if (!employee) {
            return res.status(404).json({ error: "employee not found" })
        }
        return res.status(200).json({ success: "queue has been updated successfully" })

    } catch (err) {
        next(err)
    }
}

const addToQueue = async (req, res, next) => {
    const {id, selectedQueue, data} = req.body
    try {
        let employee = await Employee.findById(id).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        let queue = employee.profileData.queues[selectedQueue]
        if (!queue) {
            return res.status(404).json({ error: "no queue exists" })
        }
        queue.push(data)
        await employee.save()
        return res.status(200).json({success: "Item added to queue successfully"})

    } catch(err) {
        next(err)
    }
}

const removeFromQueue = async (req, res, next) => {
    const { id, selectedQueue, patientIdentifier } = req.body
    try {
        let employee = await Employee.findById(id).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        let queue = employee.profileData.queues[selectedQueue]
        if (!queue) {
            return res.status(404).json({ error: "no queue exists" })
        }
        let index = queue.findIndex(index => index.identifier === patientIdentifier)
        queue.splice(index, 1)
        await employee.save()
        return res.status(200).json({ success: "patient has been removed from queue successfully" })
    } catch (err) {
        next(err)
    }
}

// prescriptions is an array of prescription identifiers (called queuePrescriptions in routePrescriptions redux)
const removePrescriptionsFromQueue = async (req, res, next) => {
    const {id, selectedQueue, patientIdentifier, prescriptions} = req.body
    console.log("request body", req.body)
    try {
        let employee = await Employee.findById(id).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        let queue = employee.profileData.queues[selectedQueue]
        console.log("queue", queue)

        if(!queue) {
            return res.status(404).json({ error: "no queue exists" })
        }
        let index = queue.findIndex((patient) => patient.identifier === patientIdentifier)
        console.log("index", index)
        let queuePrescriptions = queue[index].prescriptions
        for(let i = 0; i < prescriptions.length; i++) {
            let currentPrescriptionIdentifier = prescriptions[i]
            queuePrescriptions = queuePrescriptions.filter(prescription => prescription.identifier !== currentPrescriptionIdentifier)
        }
        if(queuePrescriptions.length < 1) {
            queue.splice(index, 1)
        } else {
            queue[index].prescriptions = queuePrescriptions
        }
        console.log("made it here")
        employee.markModified("profileData.queues")
        await employee.save()
        return res.status(200).json({success: "queue updated", newQueue: queue})
    } catch (err) {
        next(err)
    }
}

const clearWorkQueue = async (req, res, next) => {
    let { id } = req.body
    try {
        let employee = await Employee.findById(id).exec()
        if(!employee) {
            return res.status(404).json({error: "no employee found"})
        }
        let department = employee.department
        let employeeQueue = employee.profileData.queues.queue
        let departmentQueue = await Queue.findOneAndUpdate({department, isUpdating: false}, {isUpdating: true}, {new: true})
        if(!departmentQueue) {
            await new Promise(resolve => setTimeout(resolve, 300))
            return clearWorkQueue(req, res, next)
        }
        let queueData = departmentQueue.queues.queue
        if(department === "callCenter") {
            for(let i = 0; i < employeeQueue.length; i++) {
                let queueItem = employeeQueue[i]
                let language = queueItem.preferredLanguage ? queueItem.preferredLanguage : "English"
                let patientIdentifier = queueItem.identifier
                let prescriptions = queueItem.prescriptions
                let prescriptionIdentifiers = []
                for(const prescription of prescriptions) {
                    prescriptionIdentifiers.push(prescription.identifier)
                }
                if(!queueData[language]) {
                    queueData[language] = {
                        [patientIdentifier]: prescriptionIdentifiers
                    }
                } else if(!queueData[language][patientIdentifier]) {
                    queueData[language][patientIdentifier] = prescriptionIdentifiers
                } else {
                    let queuePrescriptions = new Set(queueData[language][patientIdentifier])
                    for(const prescription in prescriptionIdentifiers) {
                        queuePrescriptions.add(prescription)
                    }
                    queueData[language][patientIdentifier] = [...queuePrescriptions]
                }
            }
        } else {
            for(let i = 0; i < employeeQueue.length; i++) {
                let queueItem = employeeQueue[i]
                let patientIdentifier = queueItem.identifier
                let prescriptions = queueItem.prescriptions
                let prescriptionIdentifiers = []
                for(const prescription of prescriptions) {
                    prescriptionIdentifiers.push(prescription.identifier)
                }
                if(!queueData[patientIdentifier]) {
                    queueData[patientIdentifier] = prescriptionIdentifiers
                } else {
                    let queuePrescriptions = new Set(queueData[patientIdentifier])
                    for(const identifier of prescriptionIdentifiers) {
                        queuePrescriptions.add(identifier)
                    }
                    queueData[patientIdentifier] = [...queuePrescriptions]
                }
            }
        }
        employee.profileData.queues.queue = []

        employee.markModified("profileData.queues.queue")
        departmentQueue.markModified("queues.queue")

        await departmentQueue.save()
        await employee.save()
        return res.status(200).json({success: "queue cleared successfully"})

    } catch(err) {
        next(err)
    }
}

const resetPin = async (req, res) => {
    let { newPin, id, token } = req.body
    try {
        let employee = await Employee.findById(id).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        if (employee.profileData.resetAttempts <= 20) {
            if (employee.profileData.resetToken === token) {
                let hashedPin = await hashPassword(newPin)
                employee.pin = hashedPin
                employee.profileData.resetToken = null
                await employee.save()
                return res.status(200).json({ success: "pin reset successfully! 🥳" })
            }
            employee.profileData.resetAttempts += 1
            await employee.save()
            return res.status(401).json({ error: "incorrect token" })
        } else {
            return res.status(429).json({ error: "Too many reset attempts. Please contact support to regain access to your account" })
        }
    } catch (err) {
        next(err)
    }
}

const resetPassword = async (req, res) => {
    let { newPassword, email, resetToken, pin } = req.body
    try {
        let employee = await Employee.findOne({ email }).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        if (employee.profileData.resetAttempts <= 20) {
            let pinValidated = validataAuth(pin, employee.pin)
            if (employee.profileData.resetToken === resetToken && pinValidated) {
                let hashedPassword = await hashPassword(newPassword)
            } else {
                employee.profileData.resetAttempts += 1
                await employee.save()
                return res.status(401).json({ error: "incorrect token or account pin provided" })
            }
        } else {
            return res.status(429).json({ error: "Too many reset attempts. Please contact support to regain access to your account" })
        }

    } catch (err) {
        next(err)
    }
}

function createToken() {
    const validRanges = [3, "S", "E", "Y", "H", "Q", 9, "B", "V", "N", 7, "M", 0, "G", "C", "A", 2, "R", 5, "O", "F", 6, "U", 4, "J", "X", "D", 8, "Z", "I", "K", "L", "T", "W", 1, "P"]
    let token = []
    for (let i = 0; i < 6; i++) {
        token.push(validRanges[Math.round((validRanges.length - 1) * Math.random())])
    }
    return token.join("")
}

// generate reset token
const createResetToken = async (req, res) => {
    let { email } = req.body
    try {
        let employee = await Employee.findOne({ email }).exec()
        if (!employee) {
            return res.status(404).json({ error: "no employee found" })
        }
        if (employee.profileData.role !== "inactive") {
            let token = createToken()
            employee.profileData.token = token
            await employee.save()
            return res.status(200).json({ success: "Password reset email has been sent. Please check your email inbox for a password reset code" })
        } else {
            return res.status(401).json({ error: "Employee is not active in the system" })
        }
    } catch (err) {
        next(err)
    }
}

const updateProfile = async (req, res) => {
    const { profileData, id } = req.body
    try {
        let employee = await Employee.findById(id).exec()
        employee.profileData = {
            ...employee.profileData,
            ...profileData
        }
        await employee.save()
        return res.status(200).json({ success: "Profile updated successfully" })

    } catch (err) {
        next(err)
    }
}

// gets the employee (should take in either a name, or email) // should restrict to department as well unless admin or higher (or possibly H.R.)

const getEmployeeProfile = async (req, res) => {
    const { data, requesterId } = req.body
    try {
        const employee = await Employee.findOne(data).exec()
        const requester = await Employee.findById(requesterId).exec()
        if (!employee || !requester) {
            let key = Object.values(data).join("")
            return res.status(404).json({ error: `Unable to find an active employee with the provided ${key}, try searching by ${key === "email" ? "name" : "email"} instead?` })
        }
        let employeeObject = {}
        let role = requester.profileData.role
        let employeeQueueCount
        if(employee.department === "billing") {
            employeeQueueCount = Object.keys(employee.profileData.queues.queue).length
        } else if(employee.department === "callCenter") {
            let employeeQueue = employee.profileData.queues.queue
            let languages = Object.keys(employeeQueue)
            for(const language of languages) {
                let queueLen = Object.keys(language).length
                employeeQueueCount += queueLen
            }
        }
        if (role === "manager" || role === "hr" || role === "admin" || role === "superAdmin") {
            employeeObject.id = employee._id
            employeeObject.workSchedule = employee.profileData.workSchedule
            employeeObject.role = employee.profileData.role
            employeeObject.hireDate = employee.profileData.hireDate
            employeeObject.name = employee.profileData.name
            employeeObject.phone = employee.profileData.phone
            employeeObject.department = employee.department
        }
        if(employeeQueueCount) {
            employeeObject.queueLength = employeeQueueCount
        }
        if (role === "superAdmin") {
            employeeObject.IPAddressWhitelist = employee.profileData.IPAddressWhitelist
        }
        return res.status(200).json({success: "Employee found", employee: employeeObject})

    } catch (err) {
        next(err)
    }
}

// finish this use the one from below to help. The line below is added so the API doesn't freak out
const changeJobRoles = (req, res) => { res.status(200).json({success: "wazzzup" })}
// const changeJobRoles = async (req, res) => {
//     const {employeeId, requesterId, newRole, newDepartment} = req.body
//     try {
//         let employee = await Employee.findById(employeeId).exec()
//         let requester = await Employee.findById(requesterId).exec()
//         if (!employee || !requester) {
//             let key = Object.values(data).join("")
//             return res.status(404).json({ error: `Unable to find an active employee with the provided ${key}, try searching by ${key === "email" ? "name" : "email"} instead?` })
//         }
//         let role = requester.profileData.role
//         if (role === "manager" || role === "hr" || role === "admin" || role === "superAdmin") {
//             employee.profileData.role = newRole
//             employee.department = newDepartment

//         }

//     } catch (error) {
//         if (error.message) {
//             return res.status(400).json({ error: error.message })
//         } else if (error.error) {
//             return res.status(400).json({ error: error.error })
//         }
//         return res.status(400).json({ error })
//     }
// }

// const changeJobRoles = (req, res) => {
//     const { employeeId, requesterId, newRole, newDepartment } = req.body
//     if (verifyId(employeeId) && verifyId(requesterId)) {
//         Employee.findById(employeeId, (err, employeeDoc) => {
//             if (err) {
//                 return res.status(400).json(err)
//             } else if (!employeeDoc) {
//                 return res.status(404).json({ error: "No employee found" })
//             }
//             const decryptedEmployeeProfile = JSON.parse(decrypt(employeeDoc.profileData, "employee"))
//             Employee.findById(requesterId, (err, requesterDoc) => {
//                 if (err) {
//                     return res.status(400).json(err)
//                 } else if (!requesterDoc) {
//                     return res.status(404).json({ error: "Invalid requester id. Please log out and log back in to refresh your id" })
//                 }
//                 const decryptedRequesterProfile = JSON.parse(decrypt(requesterDoc.profileData, "employee"))
//                 if (decryptedRequesterProfile.role === "manager" && requesterDoc.department === employeeDoc.department || decryptedRequesterProfile.role === "manager" && requesterDoc.department === newDepartment || decryptedRequesterProfile.role === "hr" || decryptedRequesterProfile.role === "admin" || decryptedRequesterProfile.role === "superAdmin") {
//                     decryptedEmployeeProfile.role = newRole
//                     let encryptedEmployeeProfile = encrypt(JSON.stringify(decryptedEmployeeProfile, "employee"))
//                     Employee.findByIdAndUpdate(employeeId, { department: newDepartment, profileData: encryptedEmployeeProfile }, (err, doc) => {
//                         if (err) {
//                             return res.status(400).json(err)
//                         }
//                         if (employeeDoc.department !== newDepartment) {
//                             Queue.findOne({ department: employeeDoc.department }, { employeeCounts }, (err, oldDepartmentDoc) => {
//                                 if (err) {
//                                     return res.status(400).json(err)
//                                 }
//                                 Queue.findOne({ department: newDepartment }, { employeeCounts }, (err, newDepartmentDoc) => {
//                                     if (err) {
//                                         return res.status(400).json(err)
//                                     }
//                                     let workSchedule = Object.keys(decryptedEmployeeProfile.workSchedule)
//                                     for (let i = 0; i < workSchedule.length; i++) {
//                                         let day = workSchedule[i]
//                                         if (employeeDoc.department === "callCenter" || newDepartment === "callCenter") {
//                                             for (let j = 0; j < decryptedEmployeeProfile.languages; j++) {
//                                                 let language = decryptedEmployeeProfile.languages[j]
//                                                 if (employeeDoc.department === "callCenter") {
//                                                     oldDepartmentDoc[day][language]--
//                                                 }
//                                                 if (newDepartment === "callCenter") {
//                                                     oldDepartmentDoc[day][language]++
//                                                 }
//                                             }
//                                             if (employeeDoc.department !== "callCenter") {
//                                                 oldDepartment[day]--
//                                             }
//                                             if (newDepartment !== "callCenter") {
//                                                 newDepartmentDoc[day]++
//                                             }
//                                         }
//                                         else {
//                                             oldDepartmentDoc[day]--
//                                             newDepartmentDoc[day]++
//                                         }
//                                     }
//                                     Queue.findOneAndUpdate({ department: employeeDoc.department }, { employeeCounts: oldDepartmentDoc })
//                                     Queue.findOneAndUpdate({ department: newDepartment }, { employeeCounts: newDepartmentDoc })
//                                     return res.status(200).json({ success: "Employee Role Changed And Department Counts Updated" })
//                                 })
//                             })
//                         }
//                         return res.status(200).json({ success: "Employee Role Updated And Department Not Changed" })
//                     })
//                 }
//             })
//         })
//     }
//     return res.status(404).json({ error: "Not Found" })
// }

const updateWorkSchedule = async (req, res) => {
    res.status(200).json({suceess: "Hola"})
}

// const updateWorkSchedule = (req, res) => {
//     const { employeeId, requesterId, newSchedule } = req.body
//     let oldSchedule
//     if (verifyId(employeeId) && verifyId(requesterId)) {
//         let decryptedRequester, decryptedEmployee
//         Employee.findById(employeeId, (err, doc) => {
//             if (err) {
//                 return res.status(400).json(err)
//             } else if (!doc) {
//                 return res.status(404).json({ error: "No employee found with that Id" })
//             }
//             decryptedEmployee = JSON.parse(decrypt(doc.profileData, "employee"))

//             if (employeeId === requesterId) {
//                 decryptedEmployee.workSchedule = newSchedule
//                 oldSchedule = Object.keys(decryptedEmployee.workSchedule)

//             } else {
//                 Employee.findById(requesterId, { profileData }, (err, doc) => {
//                     if (err) {
//                         return res.status(400).json(err)
//                     }
//                     if (!doc) {
//                         return res.status(404).json({ error: "requester information not available" })
//                     }
//                     decryptedRequester = JSON.parse(decrypt(doc, "employee"))
//                 })
//                 if (decryptedRequester.role === "manager" && decryptedEmployee.department === decryptedRequester.department || decryptedRequester.role === "hr" || decryptedRequester.role === "admin" || decryptedRequester.role === "superAdmin") {
//                     oldSchedule = Object.keys(decryptedEmployee.workSchedule)
//                     decryptedEmployee.workSchedule = newSchedule
//                 }
//             }
//             if (oldSchedule) {
//                 let workDays = Object.keys(newSchedule)
//                 Department.findOne({ department: doc.department }, { employeeCounts }, (err, departmentDoc) => {
//                     if (err) {
//                         return res.status(400).json(err)
//                     }
//                     for (let i = 0; i < workDays.length; i++) {
//                         let currentDay = workDays[i]
//                         let currentDayOld = oldSchedule[i]
//                         if (doc.department === "callCenter") {
//                             let languages = decryptedEmployee.languages
//                             for (let j = 0; j < languages.length; j++) {
//                                 const language = languages[j]
//                                 departmentDoc[currentDay][language]++
//                                 departmentDoc[currentDayOld][language]--
//                             }
//                         } else {
//                             departmentDoc[currentDay]++
//                             departmentDoc[currentDayOld]--
//                         }
//                     }
//                     Department.findOneAndUpdate({ department: doc.department }, { employeeCounts: departmentDoc }, (err, updatedDepartmentDoc) => {
//                         if (err) {
//                             return res.status(400).json(err)
//                         }
//                         let encryptedEmployee = encrypt(JSON.stringify(decryptedEmployee), "employee")
//                         Employee.findByIdAndUpdate(employeeId, { profileData: encryptedEmployee }, (err, doc) => {
//                             if (err) {
//                                 return res.status(400).json(err)
//                             }
//                             return res.status(200).json({ success: "Employee schedule updated successfully" })
//                         })
//                     })
//                 })
//             }
//             return res.status(403).json({ error: "Update schedule failed precondition check" })
//         })
//         return res.status(404).json({ error: "Employee not found" })
//     }
//     return res.status(403).json({ error: "Unexpected Input" })
// }
// mark employee as inactive // will remove login information from employee's account (restricted to admin and SuperAdmin) when an employee leaves the company

const markAsInactive = async (req, res) => {
    const {employeeId, requesterId} = req.body
    try {
        let employee = await Employee.findById(employeeId).exec()
        let requester = await Employee.findById(requesterId).exec()
        if (!employee || !requester) {
            let key = Object.values(data).join("")
            return res.status(404).json({ error: `Unable to find an active employee with the provided ${key}, try searching by ${key === "email" ? "name" : "email"} instead?` })
        }
        let role = requester.profileData.role
        if(role === "manager" || role === "hr" || role === "admin" || role === "superAdmin") {
            employee.profileData.role = "inactive"
            await employee.save()
            return res.status(200).json({success: "employee has been set to inactive"})
        } else {
            return res.status(401).json({error: "you do not have sufficient privleges to make this request"})
        }
        
    } catch (err) {
        next(err)
    }
}

const markAsActive = async (req, res) => {
    const {employeeId, requesterId, newRole} = req.body
    try {
        let employee = await Employee.findById(employeeId).exec()
        let requester = await Employee.findById(requesterId).exec()
        if (!employee || !requester) {
            let key = Object.values(data).join("")
            return res.status(404).json({ error: `Unable to find an active employee with the provided ${key}, try searching by ${key === "email" ? "name" : "email"} instead?` })
        }
        let role = requester.profileData.role
        if(role === "manager" || role === "hr" || role === "admin" || role === "superAdmin") {
            employee.profileData.role = newRole
            await employee.save()
            return res.status(200).json({success: "employee has been set to active"})
        } else {
            return res.status(401).json({error: "you do not have sufficient privleges to make this request"})
        }
        
    } catch (err) {
        next(err)
    }
}

module.exports = {
    login,
    logout,
    registerNewUser,
    unlockApp,
    // uploadProfilePhoto,
    getQueues,
    getQueue,
    replaceQueue,
    addToQueue,
    removeFromQueue,
    removePrescriptionsFromQueue,
    clearWorkQueue,
    resetPin,
    getEmployeeProfile,
    resetPassword,
    createResetToken,
    updateProfile,
    changeJobRoles,
    updateWorkSchedule,
    markAsInactive,
    markAsActive,
    dropQueues
}