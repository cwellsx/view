import * as fs from "fs";
import * as path from "path";
import { ImageLayers, LayerNode } from "../data/ImageLayers";

export function readLayers(filename: string) {
  const text = fs.readFileSync(filename, "utf8");
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
    if (level > (previous + 1)) {
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
  })

  const json = JSON.stringify(rc);

  const ext = path.extname(filename);
  const output = filename.slice(0, -ext.length) + ".json";

  fs.writeFileSync(output, json, "utf8");
}