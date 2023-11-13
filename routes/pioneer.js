const express = require("express")
const {getPioneerData, getActiveIds} = require("../sql/getPioneerData.js")

const router = express.Router()

router.get("/activeIds", async (req, res) => {
    try {
        const data = await getActiveIds()
        res.json(data)
    } catch(error) {
        res.status(500).json({error})
    }
})

router.post("/pioneerData", async (req, res) => {
    const ids = req.body.ids
    try {
        const data = await getPioneerData(ids)
        res.json(data)
    } catch(error) {
        console.log(`There was an error fetching pioneer data ${error}`)
        res.status(500).json({ error: "Failed to fetch Pioneer data" })
    }
})

module.exports = router