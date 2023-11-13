// const mongoose = require("mongoose")

// const Schema = mongoose.Schema

// const departmentQueueSchema = new Schema({
//     department: {
//         type: String,
//         required: true
//     },
//     employeeCounts: {
//         type: Schema.Types.Mixed,
//         required: true,
//     },
//     isUpdating: {
//         type: Boolean,
//         default: false
//     },
//     queues: {
//         type: Schema.Types.Mixed,
//         required: true,
//         set: v => v
//     },
//     updated: { type: Date, default: Date.now() }
// },
//     // {collection: "Queues"}
// )



// module.exports = mongoose.model("Queue", departmentQueueSchema)

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const departmentQueueSchema = new Schema({
    department: {
        type: String,
        required: true,
        trim: true
    },
    queues: {
        type: Object,
        required: true
    },
    employeeCounts: {
        type: Object,
        required: true
    },
    isUpdating: {
        type: Boolean,
        default: false
    },
    updated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Queue", departmentQueueSchema);
