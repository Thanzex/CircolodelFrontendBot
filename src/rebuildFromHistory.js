const { parse, HTMLElement } = require('node-html-parser');
const fs = require('fs');
const { addNewLink } = require('./Db');

/**
 *
 * @param {string} history
 */
function rebuildFromHistory(history) {
  const root = parse(history);
  const historyElement = root.querySelector('.history');
  const historyNodes = historyElement.querySelectorAll('.message')
  historyNodes.forEach(node => {
    analyzeMessage(node);
  })


  function analyzeMessage(node) {
    const linkNodes = node
      ?.querySelector('.body .text')
      ?.querySelectorAll('a');
      
    if (linkNodes) {
      handleNewLinks(node, linkNodes);
    }
  }

  function handleNewLinks(node, linkNodes) {
    const messageId = +node.id.substring(7);
    const links = linkNodes.map(node => node._attrs.href);
    links.forEach(link => addNewLink(link, messageId)
    );
  }
}

exports.rebuildFromHistory = rebuildFromHistory