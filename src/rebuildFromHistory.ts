import { parse, HTMLElement } from 'node-html-parser'
import fs from 'fs'
import { addNewLink } from './Db'

/**
 *
 * @param {string} history
 */
export function rebuildFromHistory(history: string) {
  const root = parse(history);
  const historyElement = root.querySelector('.history');
  const historyNodes = historyElement.querySelectorAll('.message')
  historyNodes.forEach(node => {
    analyzeMessage(node);
  })


  function analyzeMessage(node: HTMLElement) {
    const linkNodes = node
      ?.querySelector('.body .text')
      ?.querySelectorAll('a');

    if (linkNodes) {
      handleNewLinks(node, linkNodes);
    }
  }

  function handleNewLinks(node: HTMLElement, linkNodes: any[]) {
    const messageId = +node.id.substring(7);
    const links = linkNodes.map(node => node._attrs.href);
    links.forEach(link => addNewLink(link, messageId)
    );
  }
}
