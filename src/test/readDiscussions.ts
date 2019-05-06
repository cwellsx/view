import * as fs from "fs";
import * as path from "path";
import { BareDiscussion } from "../data/Discussion";
import { FeatureSummary } from "../data/FeatureSummary";
import { featureSummaries } from "../io/mock";

export function readDiscussions(filename: string) {
  const text = fs.readFileSync(filename, "utf8");
  const lines = text.split(/\r?\n/);
  const input: string[][] = [];

  lines.forEach(line => {
    if (!line.length) {
      return;
    }
    const words: string[] = line.split(".").map(word => word.trim()).filter(word => word.length);
    if (!words.length) {
      return;
    }
    input.push(words);
  });

  function random_1to10(): number { return Math.floor((Math.random() * 10) + 1); };
  function random_feature(): FeatureSummary { return featureSummaries[Math.floor((Math.random() * featureSummaries.length))]; };
  const startDate = new Date(2019, 0);
  function random_date(): string {
    const date = new Date(startDate.getTime() + (Math.random() * (Date.now() - startDate.getTime())));
    return date.toUTCString();
  };

  const current = { line: 0, word: 0 };
  function next(eos: string, newLine: boolean = false): { sentence: string, newLine: boolean } | undefined {
    if (input.length === current.line) {
      return undefined;
    }
    const words: string[] = input[current.line];
    if (words.length > current.word) {
      return { sentence: words[current.word++] + eos, newLine };
    } else {
      ++current.line
      current.word = 0;
      return next(eos, true);
    }
  }
  function fetch(count: number, eos: string): string[] | undefined {
    const rc: string[] = [];
    while (count--) {
      const found = next(eos);
      if (!found) {
        break;
      }
      const { sentence, newLine } = found;
      if (newLine || !rc.length) {
        rc.push(sentence);
      } else {
        rc[rc.length - 1] += " " + sentence;
      }
    }
    return rc.length ? rc : undefined;
  }
  function fetchTitle(): string | undefined {
    const fetched = fetch(1, "?");
    return (fetched) ? fetched[0] : undefined;
  }
  function fetchDiscussion(discussionId: number): BareDiscussion | undefined {
    const title = fetchTitle();
    if (!title) {
      return undefined;
    }
    const topic: FeatureSummary = random_feature();
    const messages = [];
    const n = random_1to10();
    for (let i = 0; i < n; ++i) {
      const userId = random_1to10() - 1; // 0 to 9
      const text: string[] | undefined = fetch(random_1to10(), ".");
      if (!text) {
        return undefined;
      }
      const markdown = text.join("\r\n\r\n");
      const dateTime = random_date();
      messages.push({ userId, markdown, dateTime });
    }
    messages.sort((x, y) => new Date(x.dateTime).getTime() - new Date(y.dateTime).getTime());
    return {
      meta: {
        idName: { id: discussionId, name: title },
        topicSummary: { idName: topic.idName, pageType: "Feature" }
      },
      messages
    }
  };

  const rc: BareDiscussion[] = [];
  for (let discussionId: number = 0; ; ++discussionId) {
    const discussion = fetchDiscussion(discussionId + 1);
    if (!discussion) {
      break;
    }
    rc.push(discussion);
  }

  const json = JSON.stringify(rc, null, '\t');

  const ext = path.extname(filename);
  const output = filename.slice(0, -ext.length) + ".json";

  fs.writeFileSync(output, json, "utf8");
}