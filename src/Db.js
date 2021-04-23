const { JsonDB } = require('node-json-db')
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')

const DB = new JsonDB(new Config('./data/db', true))

exports.DB = DB