export function fixLinkProtocol(link: string) {
  if (!link.startsWith("http")) {
    console.log("No protocol:", link);
    link = 'https://'.concat(link);
  }
  return link;
}

export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}
