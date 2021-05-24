function fixLinkProtocol(link) {
  if (!link.startsWith("http")) {
    console.log("No protocol:", link);
    link = 'https://'.concat(link);
  }
  return link;
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
exports.fixLinkProtocol = fixLinkProtocol;
exports.randomNumber = randomNumber
