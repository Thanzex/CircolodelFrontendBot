import { CommandHandlerParams } from "../common"
import { DB } from "../db"

export function addCommand(ctx: CommandHandlerParams): void {
  if (ctx.chat.type != "private") return
  try {
    console.log(`Got /add from ${ctx.chat.username}`)
    DB.push("/admin/DB", {
      rebuilding: {
        inProgress: true,
        chatId: ctx.chat.id,
      },
    })
  } catch (e) {
    console.log(e)
  }
}
