const express = require("express")
const mongoose = require("mongoose")
const cookieParser = require('cookie-parser')
const helmet = require("helmet")
const multer = require("multer")
require("dotenv").config()

// debugging
// mongoose.set("debug", true)

// import routes
const cors = require("cors")
const queueRoutes = require("./routes/departmentQueue")
const patientRoutes = require("./routes/patient")
const prescriptionRoutes = require("./routes/prescription")
const employeeRoutes = require("./routes/employee")
const pioneerRoutes = require("./routes/pioneer")
const uploadRoutes = require("./routes/uploadData")
const errorHandler = require("./middleware/errorHandler")


const app = express()

// Middlewares
app.use(cors({
    origin: "*"
}))
app.use(express.json())
app.use(helmet())
// app.use(helmet.hsts({
//     maxAge: 31536000,
//     includeSubDomains: true,
//     preload: true,
//   }));
app.use(cookieParser())
app.use('/profilePhotos', express.static('profilePhotos'))

// Routes
app.use("/queue", queueRoutes)
app.use("/patient", patientRoutes)
app.use("/prescription", prescriptionRoutes)
app.use("/employee", employeeRoutes)
app.use("/pioneer", pioneerRoutes)
app.use("/sync", uploadRoutes)

app.use(errorHandler)

const port = process.env.PORT
const uri = process.env.MONGO_URI
mongoose.connect(uri).then(() => {
    app.listen(port, () => console.log(`DB Connected and API is listening on port ${port}`))
}).catch((error) => console.log(error))