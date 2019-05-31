import { getTagText } from "../../src/server/bare";

/*
  Assumes that topics may come from a spreadsheet
  so they're lines of tab-delimited words or phrases
*/

export function readTopics(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const rc: string[] = [];
  const unique: Set<string> = new Set<string>();
  lines.forEach(line => {
    const words: string[] = line.split("\t");
    words.forEach(word => {
      word = word.replace("*", ""); // some input files contain extraneous "*"
      if (word.length) {
        unique.add(word);
      }
    });
  });
  unique.forEach(value => rc.push(value));
  rc.sort((x, y) => x.localeCompare(y));

  // ensure the topics aren't ambiguous when they're converted to tags
  const tags: Set<string> = new Set<string>();
  rc.forEach(topic => {
    const key = getTagText(topic);
    if (tags.has(key)) {
      throw new Error("Ambiguous topic key: " + key);
    }
    tags.add(key);
  })
  return rc;
}
