import { ImageLayers, LayerNode } from "shared-lib";

/*
  This processes a layers.txt file whose format is a tree of words,
  with "  " of indentation for child nodes, for example:

Dogs
  Poodle
  Yorkie
  Collies
    Border Collie
    Australian Collie
Cats
  Persian
  Siamese
  Tabby

*/

export function readLayers(text: string): object {
  const lines = text.split(/\r?\n/);
  const rc: ImageLayers = [];
  const current: LayerNode[] = [];

  const all: Set<string> = new Set<string>();

  let previous = 0;
  lines.forEach((line) => {
    // get the level
    function whitespaceLength(): number {
      let i = 0;
      while (line[i] === " ") {
        ++i;
      }
      return i;
    }
    const index: number = whitespaceLength();
    if (index % 2) {
      throw new Error(`index = ${index} on line '${line}'`);
    }
    const level = index / 2;
    // trim the text
    const name = line.substring(index);
    // assert the level is sane
    if (level > previous + 1) {
      throw new Error(`Too much indentation (${level}) on line '${line}'`);
    }
    previous = level;
    // this is a new node
    const node: LayerNode = { name };
    // add to parent
    if (!level) {
      // it's a root node
      rc.push(node);
    } else {
      // it's a chld node
      const parent = current[level - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node);
    }
    // node is a current candidate
    current[level] = node;
    // ensure uniqueness
    if (all.has(name)) {
      throw new Error(`Duplicate node name '${name}'`);
    }
    all.add(name);
  });

  return rc;
}
