/*
  Assumes that topics may come from a spreadsheet
  so they're lines of tab-delimited words or phrases
*/

export function readTopics(text: string): string[] {
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
  return rc;
}
