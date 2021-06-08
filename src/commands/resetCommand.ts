import { CommandHandlerParams } from "../common"
import { ADMIN_ID } from "../constants"
import { DB } from "../db"

export function resetCommand(ctx: CommandHandlerParams): void {
  if (ctx.message.from.id === ADMIN_ID) {
    console.log("Resetting db.")

    DB.push("/links", [])
  }
}
