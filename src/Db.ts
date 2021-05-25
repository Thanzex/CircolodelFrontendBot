
import { JsonDB } from 'node-json-db'
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')
import { fixLinkProtocol } from "./utils"


export const DB = new JsonDB(new Config('./data/db', true))

DB.push("/links", [])

/**
 * Aggiunge un link al DB da una stringa
 * 
 * @param {string} link 
 * @param {number} id id del messaggio con il link
 */
export function addNewLink(link: string, id = 0) {
  console.log("Adding link.")
  try {
    link = fixLinkProtocol(link)

    const url = new URL(link)

    if (DB.find('/links', (entry) => entry.host == url.host && entry.path == url.pathname))
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


export interface DBEntry {
  host: string
  path: string
  complete: string
  id: number
}
