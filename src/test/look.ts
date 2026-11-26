/**
 * The markup of an element without its text: tags, classes and attributes. Two roles that must
 * look alike from across the table (same colors, same shape) produce the same string.
 */
export function look(element: Element): string {
  const clone = element.cloneNode(true) as Element
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT)
  const texts: Node[] = []
  while (walker.nextNode()) texts.push(walker.currentNode)
  texts.forEach((text) => text.parentNode?.removeChild(text))
  return clone.outerHTML
}
