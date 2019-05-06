import * as fs from "fs";
import * as path from "path";

export function readFeatures(filename: string) {
  const text = fs.readFileSync(filename, "utf8");
  const lines = text.split(/\r?\n/);
  const rc: string[] = [];

  lines.forEach(line => {
    const words: string[] = line.split("\t");
    words.forEach(word => {
      if (word.length) {
        rc.push(word);
      }
    });
  });

  rc.sort((x, y) => x.localeCompare(y));

  const json = JSON.stringify(rc);

  const ext = path.extname(filename);
  const output = filename.slice(0, -ext.length) + ".json";

  fs.writeFileSync(output, json, "utf8");
}
