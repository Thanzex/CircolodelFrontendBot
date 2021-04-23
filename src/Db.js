const { JsonDB } = require('node-json-db')
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')

const DB = new JsonDB(new Config('./data/db', true))

DB.push("/links", [])

exports.DB = DB