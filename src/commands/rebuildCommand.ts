import { CommandHandlerParams } from '../common';
import { DB } from '../db';

export function rebuildCommand(ctx: CommandHandlerParams) {
  if (ctx.chat.type != 'private')
    return;
  try {
    console.log(`Got /rebuild from ${ctx.chat.username}`);
    DB.push('/admin/DB', {
      rebuilding: {
        inProgress: true,
        chatId: ctx.chat.id
      }
    });
  } catch (e) {
    console.log(e);
  }
}
