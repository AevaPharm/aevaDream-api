const employees = {
    email: "",
    pin: "0000", //hashed with PIN HASH
    password: "", //hashed Strong password (enforce PW Strength on front end)
    loggedIn: false,
    department: "",
    profileData: "" // this will be an encrypted string that will store general profile data. Decrypted on front end and saved in redux then encrypted when changed
}
const profileData = {
    name: "",
    resetToken: "",
    extension: "",
    role: "agent", // agent for call center, also biller, pharmacist, intake, driver, hr, manager, admin, superAdmin, and inactive
    IPAddressWhitelist: [],
    profileImage: "",
    preferences: {
        sidebarBackgroundImage: true,
        sidebarMini: false,
        fixedNavbar: true,
        filterColor: "",
        sidebarImage: "",
        lockScreenImage: ""
    },
    notifications: [],
    queues: {
        // this will change based on the employee's position. 
        workQueue: [{}], // default dashboard view
        failedAudit: [{}], // for Billers
        billLater: [{}], // for Billers (refill too soon) just update nextFill date and pull into ready to bill queue when it is bill date
        readyToBill: [{}], // this will be the default queue
        callBacks: [{}], // for call center
        medicationOnOrder: [{}], // for pharmacy
        needsCompounding: [{}], // for pharmacy
        needsCounciling: [{}], // for pharmacy
        // shipping
        deliveryPending: [{}], // default queue
        outForDelivery: [{}],
        deliveryProblems: [{}],
    },
    rxLog: {
        year: {
            month: {
                date: [
                    {
                        rx: "prescription._id",
                        actionTaken: "",
                        sentToDepartment: "",
                        sentToQueue: "",
                        ipAddress: ""
                    }
                ]
            }
        }
    },
    languages: ["English",], // list of languages spoken for call center employees
    workSchedule: {
        0: "8am - 5pm",
        1: "8am - 5pm",
        2: "8am - 5pm",
        3: "8am - 5pm",
        4: "8am - 5pm",
    },
    hireDate: "",
    errorRate: 0 // for billers
}

const patient = {
    _id: "",

    preferredLanguage: "English",
    deliveryPreference: "delivery", // or pickup
    identifier: "", // hashed string name,dob
    patientData: "" // encrypted string
}
const patientData = {
    name: "",
    phone: "",
    dob: "",
    callCount: 0,
    notes: "",
    addresses: {
        billing: { street: "", street2: "", city: "", state: "", zip: "" },
        delivery: { street: "", street2: "", city: "", state: "", zip: "" } // default to a copy of billing address
    },
    callRecord: [{ contactedBy: "employee._id", timestamp: new Date(Date.now()), result: {} }],
    activePrescriptions: {
        rxNum: _id
    },
    inactivePrescriptions: {
        rxNum: _id
    },
    insurance: {
        primary: { number: 111, provider: "" },
        alternate: { number: 222, provider: "" }
    }
}

const prescriptions = {
    _id: "",
    lastUpdated: new Date(Date.now()),
    identifier: "", // encrypted string of patientID and rxNumber 
    nextFill: new Date(Date.now()), // calculate next fill based on ins billing OR based on projected day suppply - 2 days. Whichever is greater
    prescriptionInformation: "", // encrypted string
    status: "", // workflow status
    active: true,
    customer: "patient._id",
    queue: "",
    department: "",
}
const prescriptionInformation = { // when updating the rx push to this array, when referencing pop off to get the last person who interacted with rx by department
    updates: {
        "callCenter": [{
            timestamp: new Date(Date.now()),
            updatedBy: "employee._id",
            actionTaken: "",
            ipAddress: "",
            sentToQueue: ""
        },
            "...other departments"
        ]
    },
    rxNum: "0001",
    name: "",
    notes: [], // {employee: employee._id, note: ""}
    prescriber: { name: "", phone: "", fax: "", address: { street: "", office: "", city: "", state: "", zip: "" } },
    lastFilled: Date.now(),
    lastDeliveryAttempted: Date.now(),
    pharmacy: "",
    refillsLeft: 0,
    dayQty: 30,
    price: 199.99,
    coPay: 19.99,
    paymentMethod: ""
}

const queues = [
    {
        department: "callCenter",
        employeeCounts: {
            0: { total: 4, english: 4, spanish: 1 },
            1: { total: 5, english: 5, spanish: 2 },
            2: { total: 4, english: 4, spanish: 1 },
            3: { total: 4, english: 4, spanish: 1 },
            4: { total: 4, english: 4, spanish: 1 },
            5: { total: 4, english: 4, spanish: 1 },
            6: { total: 4, english: 4, spanish: 1 }
        },
        isUpdating: false,
        queues: {
            english: {
                "patient._id": [{}] // this way we can iterate over the prescriptions with constant time
            },
            spanish: {},
            german: {}
        }
    },
    {
        department: "billing",
        employeeCounts: {
            0: 4,
            1: 5,
            2: 4,
            3: 4,
            4: 4,
            5: 4,
            6: 4
        },
        isUpdating: false,
        queues: {
            queue: {
                "patient._id": [{}]
            }
        }
    }, 
    ...etc
]

const queuess = {
    callCenter: {
        employeeCounts: {
            0: { total: 4, english: 4, spanish: 1 },
            1: { total: 5, english: 5, spanish: 2 },
            2: { total: 4, english: 4, spanish: 1 },
            3: { total: 4, english: 4, spanish: 1 },
            4: { total: 4, english: 4, spanish: 1 },
            5: { total: 4, english: 4, spanish: 1 },
            6: { total: 4, english: 4, spanish: 1 }
        },
        isUpdating: false,
        queues: {
            callQueue: {
                english: [],
                other: {
                    spanish: [],
                    german: []
                }
            },
            deliveryProblems: []
        }
    },
    billing: {
        employeeCounts: {
            0: 4,
            1: 5,
            2: 4,
            3: 4,
            4: 4,
            5: 4,
            6: 4
        },
        isUpdating: false,
        queues: {
            queue: []
        }
    },
    pharmacist: {
        employeeCounts: {
            0: 1,
            1: 1,
            2: 1,
            3: 1,
            4: 1,
            5: 1,
            6: 1
        },
        isUpdating: false,
        queues: {
            counceling: [],
            opioid: [],
            renewals: [],
            alternative: [],
            contactPrescriber: []
            // group contactPrescriber, alternative, and renewals together (Dino mentioned wanting to sort by prescriber)
        }
    },
    blueDiamond: {
        isUpdating: false,
        queues: {
            intake: [],
            counceling: [],
            compounding: [],
            onOrder: [],
            pendingFill: [],
            pendingPickUp: []
        }
    },
    valleyView: {
        isUpdating: false,
        queues: {
            intake: [],
            counceling: [],
            compounding: [],
            onOrder: [],
            pendingFill: [],
            pendingPickUp: []
        }
    },
    shipping: {
        isUpdating: false,
        queues: {
            waiting: [],
            out: [],
            completed: [],
            pendingSignature: [],
            deliveryFailed: []
        }
    }
}

//prescriptions are an array of prescription._id in mongo database
const analytics = {
    2023: {
        January: {
            "00": {
                billing: { newRx: 0, readyToBill: 0, paPending: 0 },
                callCenter: { num: 0, processed: 0 }, // num === queue.length from previous day processed = passed from agent at signout (added together for all agents processed = processed + agent.processed)
                pharmacy: {
                    bd: { intake: 0, compounding: 0, needsCounciling: 0, medicationOnOrder: 0, needsDur: 0, waitingToFill: 0 },
                    vv: { intake: 0, compounding: 0, needsCounciling: 0, medicationOnOrder: 0, needsDur: 0, waitingToFill: 0 }
                },
                shipping: { pending: 0, out: 0, deliveryProblems: 0, delivered: 0 }
            }
        }
    }
}

