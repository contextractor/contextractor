/**
 * The minimal DOM surface this package and its consumers walk.
 *
 * Declared structurally rather than pulled from `lib.dom`, so the package keeps
 * `"lib": ["ES2022"]` and stays independent of which implementation parsed the
 * HTML (today `@mixmark-io/domino`). This package is the single owner of that
 * dependency and of its type surface — `@contextractor/extraction` reaches the
 * DOM through here rather than declaring the untyped module a second time.
 */
export interface DomNode {
  readonly nodeType: number;
  readonly nodeName: string;
  readonly nodeValue: string | null;
  readonly firstChild: DomNode | null;
  readonly nextSibling: DomNode | null;
}

/** A {@link DomNode} of element type: it carries attributes and can be removed. */
export interface DomElement extends DomNode {
  readonly outerHTML: string;
  getAttribute(name: string): string | null;
  remove(): void;
}

/**
 * What `querySelectorAll` returns. It is array-like — numeric indices, `length`,
 * `item()` — but **not iterable**, so `for…of` over it throws. Use
 * {@link elementsOf} rather than spreading it.
 */
export interface DomNodeList {
  readonly length: number;
  item(index: number): DomElement | null;
}

/** A parsed document. */
export interface DomDocument {
  readonly documentElement: DomElement | null;
  readonly body: DomElement | null;
  querySelectorAll(selector: string): DomNodeList;
}

/** The `Node.nodeType` values the renderers distinguish. */
const ELEMENT_NODE = 1;
export const TEXT_NODE = 3;

/** Narrow a {@link DomNode} to a {@link DomElement}. */
export function isElement(node: DomNode): node is DomElement {
  return node.nodeType === ELEMENT_NODE;
}

/** Lowercased tag name of a node. */
export function tagNameOf(node: DomNode): string {
  return node.nodeName.toLowerCase();
}

/**
 * Snapshot a {@link DomNodeList} into a real array. Two reasons this is not a
 * spread: the list is not iterable, and callers that remove elements must not
 * mutate the collection they are walking.
 */
export function elementsOf(list: DomNodeList): DomElement[] {
  const out: DomElement[] = [];
  for (let index = 0; index < list.length; index += 1) {
    const element = list.item(index);
    if (element !== null) out.push(element);
  }
  return out;
}
