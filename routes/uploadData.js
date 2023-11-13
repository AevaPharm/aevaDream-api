const express = require("express")
const {uploadData} = require("../uploadData/uploadAlgorithm")

const router = express.Router()

router.get("/upload", async(req, res) => {
    try {
        const data = await uploadData()
        res.json(data)
    } catch(error) {
        console.log(`There was an error fetching pioneer data ${error}`)
        res.status(500).json({ error})
    }
})

module.exports = router