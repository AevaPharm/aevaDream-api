// this shows the format and structure of data stored in the database. This will be mutated by the API

/* 
- Biller received PA Required from the insurance.
- Medication required PA - caller needs to inquire if the patient approves the PA and/or wants an Alternative. 
- PA Approved by patient - Go to biller (me; April) process the PA - may take from 24 hours to 6 months to receive a result. (Patients may decline and request ALT or Decline both.)
- Alternative - Contact Prescriber for Alternative - to Dino to get a NEW Rx (just in case patient doesn't want to wait for PA)  (Patients may decline and wait for PA to approve.)
- New Script - to the Biller. 
*/

/*

Workflow Outline

Call Center:
- Approved RX (sends to pharmacy)
- BA - Meet & Greet (Not sure where it goes from here)
- Call Later (Is placed in agent's call later queue)
- Needs Insurance Info (Goes back to billers once collected)
- New RX (Goes to Pharmacy (will go to needs counciling))
- Patient Transfer In (Pretty sure this goes to Pharmacy, but can go to billers if needed)
- Reschedule Delivery (Sends to Delivery Pending Queue)
- PA Required (If approved goes to billers. If alt is required goes to Dino then to the billers)
- Future Fill (If processed by Call Center this will go to pharmacy intake)
- Refill Requests (If patient approves, goes to Dino to reach out to prescriber for approval then billers if approved. If no answer goes out as Homework)
- Refills (sends to billers then pharmacy)
- Prescriber Denied * (Reach out to the caller and explain the reason for the denial. (SHOULD RIP RX, but I am not sure management would approve))

Pharmacist (Dino):
- Alt Requests - (If approved goes to billing then C.C. then Pharmacy)
- Contact Prescriber - Refill/ Renewal (Comes from Call Center. If approved goes to billers, then call center to schedule delivery, then pharmacy intake)
- Contact Prescriber - Wrong Phone Number (goes out as H.W.)
- Contact Patient / Contact Prescribers (not sure what this is used for)

Pharmacy:
- All go to intake queue first.
- Try to provide as much context as possible, but most information comes from Pioneer (Primaraly use RX Numbers)
- Cannot Fill (Not sure where this goes if anywhere)
- Completed (Updates from Delivery Pending to Completed once driver gets back from route)
- Medication On Order (Not sure)
- Needs Counciling - Pharmacist (new RX's. Goes to ready to fill once completed)
- Needs Compounding Formula - Pharmacist (Goes to compounding queue) (goes to waiting for fill - Compound after)
- Needs DUR (goes to DUR Queue)
- Partial (sends out as a partial fill while medication is on order) (Goes to partial ready once partially filled)

Billers:
- Refill too soon (Goes in the Future fill queue ordered by expected Bill date)
- Ready to Bill (can either go to PA Required - goes to Call Center once filled)(option to mark as lien or workers comp)
- (PA Required - Patient approved send to pending PA queue - unique for each biller)

Shipping:
- starts with Delivery Pending
- Try to assign queue to each driver (not sure if that would make sense - Possibly an update to the app Needs delivery routing to ensure efficiency)
- Out for delivery - once picked up
- Waiting for signature (not sure)

*/

// User object
const user = {
    name: "",
    email: "",
    pin: 0000, //hashed
    password: "hashed value",
    extension: "",
    department: "",
    IPAddressWhitelist: [], // use ipfy api to grab public ipv4 address 
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
        billLater: [{}], // for Billers (refill too soon) (this will have bill date saved as )
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
    loggedIn: false,
    errorRate: 0, // percentage (for billers)
    languages: ["English",], // list of languages spoken for call center employees
    workSchedule: {
        0: "8am - 5pm",
        1: "8am - 5pm",
        2: "8am - 5pm",
        3: "8am - 5pm",
        4: "8am - 5pm",
    },
    hireDate: ""
}

// patient object
const patient = {
    name: "",
    phone: "",
    email: "",
    addresses: {
        billing: { street: "", street2: "", city: "", state: "", zip: "" },
        delivery: { street: "", street2: "", city: "", state: "", zip: "" } // default to a copy of billing address
    },
    preferredLanguage: "", // language spoken
    callRecord: [{ contactedBy: "AM", timestamp: new Date(Date.now()), result: {} }],
    deliveryPreference: "delivery", // or pickup
    prescriptions: [
        { rxNum: "status" }
    ],
    insurance: {
        primary: { number: 111, provider: "" },
        alternate: { number: 222, provider: "" }
    }
}

// queues objects (queues database) all are stacks (F.I.F.O.) these queues will act as data stores of information and will be updated when a queue is assigned to an agent.

const queues = {
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
    billers: {
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
            futureFill: [],
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
            counciling: [],
            opioid: [],
            refills: [],
            alternative: []
        }
    },
    blueDiamond: {
        isUpdating: false,
        queues: {
            intake: [],
            counciling: [],
            compounding: [],
            stat: []
        }
    },
    valleyView: {
        isUpdating: false,
        queues: {
            intake: [],
            counciling: [],
            compounding: [],
            stat: []
        }
    },
    delivery: {
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

/* 
Sample Object
{
    english: [],
    other: {
        spanish: [],
        ...
    }
}
*/

// patient list object



// analytics database
const analytics = {
    newPatients: { "1/25/2023": 0 }, // this count will be incramented every day. New entry will be created for the next day
    patientsProcessed: { "1/25/2023": 0 },
    processing: { "1/25/2023": 0 },
    delivered: { "1/25/2023": 0 },
}



// instead of just having one monolithic object, it might be more preformant to create a new object for each month.
const JanuaryAnalytics = {
    month: 0,
    year: 2023,
    newPatients: { "1/25/2023": { num: 0, rxNumbers: [] } },
    processing: { "1/25/2023": { num: 0, rxNumbers: [] } },
    patientsProcessed: { "1/25/2023": { num: 0, rxNumbers: [] } },
    delivered: { "1/25/2023": { num: 0, rxNumbers: [] } }
}
const FebruaryAnalytics = {
    month: 1,
    year: 2023,
    newPatients: { "2/01/2023": { num: 0, rxNumbers: [] } },
    patientsProcessed: { "2/01/2023": { num: 0, rxNumbers: [] } },
    delivered: { "2/01/2023": { num: 0, rxNumbers: [] } }
}

// tracking database (HIPPA requires we track when an employee accesses a patient file)
// for most departments tracking will be updated when customer status is changed from the queue
const prescriptions = {
    rxNum: 0001,
    lastUpdated: Date(),
    updatedBy: "",
    actionTaken: "",
    ipAddress: "",
    sentToQueue: "",
    previousUpdates: [{
        date: Date(),
        updatedBy: "",
        actionTaken: "",
        ipAddress: "",
        sentToQueue: ""
    }],
    name: "",
    prescriber: "",
    status: "",
    prescriber: { name: "", phone: "", fax: "", address: { street: "", office: "", city: "", state: "", zip: "" } },
    lastFilled: new Date(Date.now()),
    nextFill: "", // calculate next fill based on ins billing OR based on projected day suppply - 2 days. Whichever is greater
    refillsLeft: 0,
    dayQty: 30,
    price: 199.99,
    coPay: 19.99,
    paymentMethod: ""
}

const employeeTracking = {
    date: {
        employeeId: [{
            rxNumber: "",
            actionTaken: "",
            sentToQueue: "",
            ipAddress: ""
        }]
    }
}
