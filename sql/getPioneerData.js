const sql = require("mssql")
const fs = require("fs")
const path = require("path")

const sqlQueryFilePath = path.join(__dirname, "./pioneerQuery.sql")
const sqlQuery = fs.readFileSync(sqlQueryFilePath, "utf-8")

const sqlIdQueryFilePath = path.join(__dirname, "./getActiveIds.sql")
const sqlIdQuery = fs.readFileSync(sqlIdQueryFilePath, "utf-8")


const config = {
    server: process.env.PIONEER_SERVER_INSTANCE,
    // port: process.env.PIONEER_PORT,
    user: process.env.SQL_USERNAME,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    options: {
        encrypt: true, // Use this if connecting to Azure or if your SQL server has SSL encryption enabled
        enableArithAbort: true, // this is needed as of MSSQL 6.x
        trustServerCertificate: true
    }
}

async function getActiveIds() {
    try {
        let activeIds = []
        let pool = await sql.connect(config)
        let result = await pool.request().query(sqlIdQuery)
        let records = result.recordset
        for(let i = 0; i < records.length; i++) {
            let currentRecord = records[i]
            activeIds.push(currentRecord.RxID)
        }
        return activeIds
    } catch(error) {
        throw error
    }
}

async function getPioneerData(ids) {
    try {
        // Injects the RxID parameters securely to mitigate SQL Injection
        let dynamicSqlQuery = sqlQuery.replace('%RXID_PLACEHOLDER%', ids.map((_, idx) => `@rxId${idx}`).join(","));

        // Connect to the SQL server
        let pool = await sql.connect(config);

        // Prepare the request and bind RxID parameters
        let request = pool.request();
        ids.forEach((id, idx) => {
            request.input(`rxId${idx}`, sql.UniqueIdentifier, id);
        });

        // Execute the query
        let result = await request.query(dynamicSqlQuery);
        
        return result.recordset;
    } catch(error) {
        console.error(`Error fetching Pioneer Data: ${error}`);
        throw error;
    }
}


module.exports = {getPioneerData, getActiveIds}

/* 
NEW PLAN
create a new SQL Query that grabs all active RX's and just returns their RX Numbers
create a function and an endpoint that can be called
return that data as an array

modify the current sql query to fetch all the data for one specific rx

create an endpoint that responds with all the data for one specific RX number
use that to upload and import data into mongo DB
*/