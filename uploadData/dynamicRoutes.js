let npis = {
    "1871693796": "carlsbad",
    "1700208089": "valley view",
    "1164924197": "blue diamond"
}

function dynamicRoutes({ transactionStatus, rxStatus, refillsRemaining, nextFill }) {
    switch (transactionStatus.toLowerCase()) {
        case "cancelled":
            if (rxStatus === "inactive") {
                return {
                    active: false,
                    department: null,
                    queue: null,
                    status: "cancelled"
                }
            } else {
                return {
                    active: true,
                    department: null,
                    queue: "queue",
                    status: "ready to bill",
                    info: "cancel renewed"
                }
            }
        case "completed":
            if (refillsRemaining > 0 && Date.now() >= new Date(nextFill)) {
                return {
                    active: true,
                    department: "billing",
                    queue: "queue",
                    status: "ready to bill",
                    info: "refill"
                }
            } else if (refillsRemaining <= 0) {
                return {
                    active: false,
                    department: null,
                    queue: null,
                    status: "expired or no refills",
                    info: "no refills"
                }
            } else {
                return {
                    active: true,
                    department: null,
                    queue: null,
                    status: "completed",
                    info: "refills remaining"
                }

            }
        case "waiting for fill": {
            return {
                active: true,
                department: "pharmacy",
                queue: "waitingForFill",
                status: "ready to process"
            }
        }
        case "out for delivery": {
            return {
                active: true,
                department: "shipping",
                queue: "out",
                status: transactionStatus
            }
        }
        case "waiting for pre-check": {
            return {
                active: true,
                department: "pharmacy",
                queue: "preCheck",
                status: transactionStatus
            }
        }
        case "waiting for data entry": {
            return {
                active: true,
                department: "billing",
                queue: "queue",
                status: "data entry needed",
                info: transactionStatus
            }
        }
        case "waiting for fill" || "waiting for central fill": {
            return {
                active: true,
                department: "pharmacy",
                queue: "waitingForFill",
                status: "ready to process"
            }
        }
        case "waiting for delivery": {
            return {
                active: true,
                department: 'shipping',
                queue: 'bin',
                status: transactionStatus
            }
        }
        case "waiting for pick up": {
            return {
                active: true,
                department: "shipping",
                queue: "pickUp",
                status: transactionStatus
            }
        }
        case "to be put in bin": {
            return {
                active: true,
                department: "shipping",
                queue: "bin",
                status: "ready to be put in bin"
            }
        }
        case "waiting for check": {
            return {
                active: true,
                department: "pharmacy",
                queue: "waitingForCheck",
                status: transactionStatus
            }
        }
        case "waiting for compounding": {
            return {
                department: "pharmacy",
                queue: "compounding",
                status: "needs compounding",
                active: true
            }
        }
        case "waiting for print": {
            return {
                active: true,
                department: "callCenter",
                queue: "queue",
                info: transactionStatus
            }
        }
        case "reject third party" || "reject secondary third party": {
            return {
                active: true,
                department: "billing",
                queue: "pa",
                status: "pa required",
                info: transactionStatus
            }
        }
        case "reject profit": {
            return {
                active: true,
                department: "pharmacy",
                queue: "priceReject",
                status: transactionStatus
            }
        }
    }
}



module.exports = dynamicRoutes