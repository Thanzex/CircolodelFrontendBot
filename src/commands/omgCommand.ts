import { Omg } from "../bot"

export function omgCommand(): void {
  console.log("Set OMG.")
  Omg.omg(() => null)
}
