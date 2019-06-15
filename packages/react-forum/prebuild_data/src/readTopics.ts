import { tagSummaryLength } from "../../src/data/tag";
import { BareTopic } from "../../src/server/bare";
import { getTagText } from "../../src/server/tagids";

function getSummary(paragraph: string[]): string | undefined {
  const random = Math.random();
  if (random > 0.66) {
    return undefined;
  }
  const max = tagSummaryLength.max;
  const wanted = (random > 0.33) ? max : max * random;
  let rc = "";
  paragraph.forEach(x => {
    const sentence = x + ".";
    if (sentence.length + rc.length + 1 > wanted)
      return;
    if (rc.length) {
      rc += " ";
    }
    rc += sentence;
  })
  if (rc.length < tagSummaryLength.min) {
    return undefined;
  }
  if (rc.length > tagSummaryLength.max) {
    throw new Error(rc);
  }
  return rc;
}

const dateTime = (new Date(Date.UTC(2019, 0))).toUTCString();
const userId = 0;

export function addSummaries(titles: string[], input: string[][]): BareTopic[] {
  // add a random summary to the titles
  return titles.map((title, index) => {
    const paragraph: string[] = input[index % input.length];
    const summary: string | undefined = getSummary(paragraph);
    return { title, summary, dateTime, userId };
  })
}

export function readTopics(input: string[][]): BareTopic[] {
  // get the first word of each paragraph
  const titles: string[] = input.map(paragraph => paragraph[0].split(" ")[0]);
  // get summaries
  const rc: BareTopic[] = addSummaries(titles, input);
  // discard duplicates
  const unique: Set<string> = new Set<string>();
  return rc.filter(tag => {
    const key = getTagText(tag.title);
    if (unique.has(key)) {
      return false;
    }
    unique.add(key);
    return true;
  })
}
