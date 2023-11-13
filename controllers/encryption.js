const crypto = require("crypto")
const bcrypt = require("bcrypt")

const EMPLOYEE_KEY = process.env.EMPLOYEE_HASH
const QUEUE_KEY = process.env.QUEUE_HASH

// password hash
const SECRET_KEY = process.env.HMAC_SECRET_KEY
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10")

// encryption used for queues and employee profile data
function encrypt(data, source) {
    let key
    if (source === "employee") {
        key = EMPLOYEE_KEY
    } else if (source === "queue"){
        key = QUEUE_KEY
    } else {
        return "Invalid Source"
    }
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(data, source) {
    let key
   if (source === "employee") {
        key = EMPLOYEE_KEY
    } else if (source === "queue"){
        key = QUEUE_KEY
    } else {
        return "Invalid Source"
    }
    const [ivHex, encryptedHex] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
}

// password hashing login
function hmacHash(data, key) {
    const hmac = crypto.createHmac("sha256", key)
    hmac.update(data)
    return hmac.digest("hex")
}

async function hashPassword(password) {
    const hmacResult = hmacHash(password, SECRET_KEY)
    return await bcrypt.hash(hmacResult, SALT_ROUNDS)
}

// the password is the plain-text password passed from the front end and the hash is the bcrypt password from mongoDB
async function validataAuth(password, hash) {
    const hmacResult = hmacHash(password, SECRET_KEY)
    return await bcrypt.compare(hmacResult, hash)
}




module.exports = { encrypt, decrypt, hashPassword, validataAuth }