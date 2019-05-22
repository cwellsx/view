import { BareDiscussion, BareMessage } from "../../src/server/bare";
import { Tag } from "../../src/data/Tag";

/*
  This function takes "Lorem ipsum" text from `random.txt`
  and uses it to construct an array of discussions each with an array of messages.
  The following are assigned randomly:

  - dates
  - topics
  - users
  - the number of sentences per message
  - the number of messages per discussion
*/

export function readDiscussions(text: string, nUsers: number, tags: Tag[]): object {
  const lines = text.split(/\r?\n/);
  const input: string[][] = [];

  lines.forEach(line => {
    if (!line.length) {
      return;
    }
    // split the line into sentences
    const words: string[] = line.split(".").map(word => word.trim()).filter(word => word.length);
    if (!words.length) {
      return;
    }
    input.push(words);
  });

  function random_userId(): number { return Math.floor(Math.random() * nUsers) + 1; };
  function random_1to10(): number { return Math.floor((Math.random() * 10) + 1); };
  function random_tag(): Tag { return tags[Math.floor((Math.random() * tags.length))]; };
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
    const tag: Tag = random_tag();
    const messages: BareMessage[] = [];
    const n = random_1to10();
    for (let i = 0; i < n; ++i) {
      const userId = random_userId();
      const text: string[] | undefined = fetch(random_1to10(), ".");
      if (!text) {
        return undefined;
      }
      const markdown = text.join("\r\n\r\n");
      const dateTime = random_date();
      messages.push({ userId, markdown, dateTime, messageId: 0 });
    }
    messages.sort((x, y) => new Date(x.dateTime).getTime() - new Date(y.dateTime).getTime());
    return {
      meta: {
        idName: { id: discussionId, name: title },
        tag
      },
      first: messages[0],
      messages: messages.slice(1)
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

  const messagesDates: [Date, BareMessage][] = [];
  rc.forEach(
    discussion => discussion.messages.forEach(message => messagesDates.push([new Date(message.dateTime), message])));
  messagesDates.sort((x, y) => x[0].getTime() - y[0].getTime());
  messagesDates.forEach((pair, index) => { pair[1].messageId = index + 1; });

  return rc;
}
