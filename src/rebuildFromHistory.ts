import { HTMLElement, parse } from 'node-html-parser';
import { addNewLink } from './db';

/**
 * Ricostruisce il DB da un dump della chat di telegram
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
