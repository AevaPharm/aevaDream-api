/* Patient Data */
const patientData = [
    {
        name: "John Smith",
        phone: "555-1234",
        dob: "01/01/1970",
        addresses: {
            billing: { street: "123 Main St", street2: "", city: "Anytown", state: "CA", zip: "12345" },
            delivery: { street: "123 Main St", street2: "", city: "Anytown", state: "CA", zip: "12345" }
        },
        callRecord: [],
        activePrescriptions: [],
        inactivePrescriptions: [],
        insurance: {
            primary: { number: 123456789, provider: "Blue Cross" },
            alternate: { number: 987654321, provider: "Aetna" }
        }
    },
    {
        name: "Jane Doe",
        phone: "",
        dob: "06/15/1985",
        addresses: {
            billing: { street: "456 Oak St", street2: "Apt 2", city: "Otherville", state: "NY", zip: "54321" },
            delivery: { street: "789 Elm St", street2: "", city: "Otherville", state: "NY", zip: "54321" }
        },
        callRecord: [],
        activePrescriptions: [],
        inactivePrescriptions: [],
        insurance: {
            primary: { number: 456789123, provider: "United Healthcare" },
            alternate: { number: 654321987, provider: "" }
        }
    },
    {
        name: "Emily Johnson",
        phone: "555-123-4567",
        dob: "01/15/1980",
        addresses: {
            billing: { street: "123 Main St", street2: "", city: "Anytown", state: "CA", zip: "12345" },
            delivery: { street: "123 Main St", street2: "", city: "Anytown", state: "CA", zip: "12345" }
        },
        callRecord: [],
        activePrescriptions: [],
        inactivePrescriptions: [],
        insurance: {
            primary: { number: 333, provider: "Blue Cross Blue Shield" },
            alternate: { number: 444, provider: "Aetna" }
        }
    },
    {
        name: "Liam Martinez",
        phone: "555-234-5678",
        dob: "05/02/1975",
        addresses: {
            billing: { street: "456 Elm St", street2: "Apt 2B", city: "Othertown", state: "NY", zip: "56789" },
            delivery: { street: "456 Elm St", street2: "Apt 2B", city: "Othertown", state: "NY", zip: "56789" }
        },
        callRecord: [],
        activePrescriptions: [],
        inactivePrescriptions: [],
        insurance: {
            primary: { number: 555, provider: "Cigna" },
            alternate: { number: 666, provider: "UnitedHealthcare" }
        }
    },
    {
        name: "Avery Wong",
        phone: "555-345-6789",
        dob: "11/25/1992",
        addresses: {
            billing: { street: "789 Oak Rd", street2: "Suite 100", city: "Smalltown", state: "IL", zip: "34567" },
            delivery: { street: "789 Oak Rd", street2: "Suite 100", city: "Smalltown", state: "IL", zip: "34567" }
        },
        callRecord: [],
        activePrescriptions: [],
        inactivePrescriptions: [],
        insurance: {
            primary: { number: 777, provider: "Humana" },
            alternate: { number: 888, provider: "Kaiser Permanente" }
        }
    },
    {
        name: "Ethan Kim",
        phone: "555-456-789",
        dob: "09/12/1987",
        addresses: {
            billing: { street: "2345 Maple Ave", street2: "", city: "Largetown", state: "TX", zip: "45678" },
            delivery: { street: "2345 Maple Ave", street2: "", city: "Largetown", state: "TX", zip: "45678" }
        },
        callRecord: [],
        activePrescriptions: [],
        inactivePrescriptions: [],
        insurance: {
            primary: { number: 999, provider: "AARP" },
            alternate: { number: 101, provider: "Molina Healthcare" }
        }
    },
    {
        name: "Aiden Lee",
        phone: "555-567-8901",
        dob: "03/08/1965",
        addresses: {
            billing: { street: "3456 Cedar St", street2: "", city: "Hometown", state: "FL", zip: "67890" },
            delivery: { street: "3456 Cedar St", street2: "", city: "Hometown", state: "FL", zip: "67890" }
        },
        callRecord: [],
        activePrescriptions: [],
        inactivePrescriptions: [],
        insurance: {
            primary: { number: 1111, provider: "Amerigroup" },
            alternate: { number: 2222, provider: "WellCare" }
        }
    },
]



/* Prescription Data */
const prescriptions = [
    {
        "updates": [
            {
                "timestamp": "2023-03-15T16:00:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0011,
        "rxName": "Hydrocodone-Acetaminophen",
        "prescriber": {
            "name": "Dr. Michael Johnson",
            "phone": "555-333-1111",
            "fax": "555-666-2222",
            "address": {
                "street": "789 Maple St",
                "office": "Suite 1000",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-12T08:00:00.000Z",
        "refillsLeft": 1,
        "dayQty": 15,
        "price": 15.99,
        "coPay": 3.00,
        "paymentMethod": "Card"
    },
    {
        "updates": [
            {
                "timestamp": "2023-03-15T14:30:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": "0008",
        "rxName": "Fluoxetine",
        "prescriber": {
            "name": "Dr. Jane Smith",
            "phone": "555-444-3333",
            "fax": "555-888-7777",
            "address": {
                "street": "123 Main St",
                "office": "Suite 700",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-14T16:00:00.000Z",
        "refillsLeft": 0,
        "dayQty": 60,
        "price": 11.99,
        "coPay": 2.50,
        "paymentMethod": "Card"
    },

    {
        "updates": [
            {
                "timestamp": "2023-03-15T15:00:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": "0009",
        "rxName": "Lisinopril",
        "prescriber": {
            "name": "Dr. Sarah Kim",
            "phone": "555-777-8888",
            "fax": "555-222-4444",
            "address": {
                "street": "456 Oak St",
                "office": "Suite 800",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-14T10:00:00.000Z",
        "refillsLeft": 3,
        "dayQty": 30,
        "price": 5.99,
        "coPay": 1.50,
        "paymentMethod": "Card"
    },

    {
        "updates": [
            {
                "timestamp": "2023-03-15T15:30:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0010,
        "rxName": "Amlodipine",
        "prescriber": {
            "name": "Dr. John Davis",
            "phone": "555-666-5555",
            "fax": "555-999-7777",
            "address": {
                "street": "789 Elm St",
                "office": "Suite 900",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-13T14:00:00.000Z",
        "refillsLeft": 2,
        "dayQty": 30,
        "price": 7.99,
        "coPay": 1.00,
        "paymentMethod": "Cash"
    },
    {
        "updates": [
            {
                "timestamp": "2023-03-15T13:00:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0005,
        "rxName": "Metformin",
        "prescriber": {
            "name": "Dr. David Lee",
            "phone": "555-999-1111",
            "fax": "555-222-3333",
            "address": {
                "street": "321 Pine St",
                "office": "Suite 400",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-13T11:00:00.000Z",
        "refillsLeft": 3,
        "dayQty": 90,
        "price": 18.99,
        "coPay": 3.00,
        "paymentMethod": "Card"
    },

    {
        "updates": [
            {
                "timestamp": "2023-03-15T13:30:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0006,
        "rxName": "Simvastatin",
        "prescriber": {
            "name": "Dr. Jennifer Lee",
            "phone": "555-222-4444",
            "fax": "555-777-9999",
            "address": {
                "street": "654 Oak St",
                "office": "Suite 500",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-14T12:00:00.000Z",
        "refillsLeft": 2,
        "dayQty": 30,
        "price": 9.99,
        "coPay": 2.00,
        "paymentMethod": "Cash"
    },

    {
        "updates": [
            {
                "timestamp": "2023-03-15T14:00:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0007,
        "rxName": "Cephalexin",
        "prescriber": {
            "name": "Dr. Mark Johnson",
            "phone": "555-333-5555",
            "fax": "555-111-9999",
            "address": {
                "street": "987 Elm St",
                "office": "Suite 600",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-15T13:00:00.000Z",
        "refillsLeft": 1,
        "dayQty": 20,
        "price": 6.99,
        "coPay": 1.00,
        "paymentMethod": "Card"
    },
    {
        "updates": [
            {
                "timestamp": "2023-03-15T11:30:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0002,
        "rxName": "Ibuprofen",
        "prescriber": {
            "name": "Dr. John Smith",
            "phone": "555-123-4567",
            "fax": "555-987-6543",
            "address": {
                "street": "123 Main St",
                "office": "Suite 100",
                "city": "Anytown",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-10T08:00:00.000Z",
        "refillsLeft": 2,
        "dayQty": 30,
        "price": 12.99,
        "coPay": 2.50,
        "paymentMethod": "Card"
    },

    {
        "updates": [
            {
                "timestamp": "2023-03-15T12:00:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0003,
        "rxName": "Amoxicillin",
        "prescriber": {
            "name": "Dr. Jane Doe",
            "phone": "555-555-5555",
            "fax": "555-555-5555",
            "address": {
                "street": "456 Elm St",
                "office": "Suite 200",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-11T09:00:00.000Z",
        "refillsLeft": 1,
        "dayQty": 20,
        "price": 7.99,
        "coPay": 1.50,
        "paymentMethod": "Cash"
    },

    {
        "updates": [
            {
                "timestamp": "2023-03-15T12:30:00.000Z",
                "updatedBy": "employee._id",
                "actionTaken": "",
                "ipAddress": "",
                "sentToQueue": "callQueue"
            }
        ],
        "rxNum": 0004,
        "rxName": "Lisinopril",
        "prescriber": {
            "name": "Dr. Sarah Johnson",
            "phone": "555-777-1234",
            "fax": "555-888-4321",
            "address": {
                "street": "789 Oak Ave",
                "office": "Suite 300",
                "city": "Anycity",
                "state": "CA",
                "zip": "12345"
            }
        },
        "lastFilled": "2023-03-12T10:00:00.000Z",
        "refillsLeft": 0,
        "dayQty": 60,
        "price": 25.99,
        "coPay": 5.00,
        "paymentMethod": "Card"
    }
]
