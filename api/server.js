// const express = require("express")
// const cors = require("cors")
// const helmet = require("helmet")
// const cookieParser = require("cookie-parser")
// const data = require("./data.js")
// const defaultQueue = require("./queue.js")
// const profile = require("./profile.js")
// const mongoose = require("mongoose")
// require("dotenv").config()

// // create routers


// // create middlewares

// const server = express()
// server.use(helmet())
// server.use(cors())
// server.use(express.json())
// server.use(express.urlencoded({ extended: true }))
// server.use(cookieParser())

// const port = process.env.PORT || 5000

// // fetch data from database with routers and set them up here
// // server.use("/api/users", usersRouter)

// server.use((err, req, res, next) => {
//     res.status(500).json({ message: err.message, stack: err.stack })
// })

// server.get("/", (req, res) => {
//     res.json({ api: "running" })
// })

// server.get("/patientList", (req, res) => {
//     res.json(data)
// })

// server.get("/userQueue", (req, res) => {
//     res.json(defaultQueue)
// })

// server.get("/profile", (req, res) => {
//     res.json(profile)
// })

// server.post("/loginUser", async (req, res) => { // use this to get the IP address first and pass it on login https://api.ipify.org/?format=json
//     const userObject = req.body.user

// })


// // connect to mongo DB
// mongoose.connect(process.env.MONGO_URI)
//     .then(() => {
//         server.listen(port, () => {
//             console.log(`Example app listening on port ${port}`)
//         })
//     })
//     .catch((error) => {
//         console.log(error)
//     })

// module.exports = server

