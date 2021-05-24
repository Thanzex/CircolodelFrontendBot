
const { JsonDB } = require('node-json-db')
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')


const DB = new JsonDB(new Config('./data/db', true))

DB.push("/links", [])

/**
 * Aggiunge un link al DB da una stringa
 * 
 * @param {string} link 
 * @param {number} id id del messaggio con il link
 */
function addNewLink(link, id = null) {
  console.log("Adding link.")
  try {
    if (!link.startsWith("http")) {
      console.log("No protocol:", link)
      link = 'https://'.concat(link)
    }

    const url = new URL(link)

    if (DB.find('/links', (entry) => entry.host == url.host && entry.path == url.path))
      return;
    
    const newEntry = {
      host: url.host,
      path: url.pathname,
      complete: url.href,
      id: id
    }
    DB.push("/links[]", newEntry)
  } catch (err) {
    console.log("Invalid link.", err)
  }
}

exports.DB = DB
exports.addNewLink = addNewLink