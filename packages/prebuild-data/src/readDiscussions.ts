import { BareDiscussion, BareMessage, TagId } from "server-types";

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

export function readDiscussions(
  input: string[][],
  nUsers: number,
  tagKeys: string[],
  imageTags: TagId[]
): BareDiscussion[] {
  function random_userId(): number {
    return Math.floor(Math.random() * nUsers) + 1;
  }
  function random_1to10(): number {
    return Math.floor(Math.random() * 10 + 1);
  }
  function random_string(strings: string[]): string {
    return strings[Math.floor(Math.random() * strings.length)];
  }
  function random_tag(): TagId {
    if (Math.random() < 0.15) {
      return imageTags.length ? imageTags[0] : { tag: tagKeys[0] };
    }
    const tag = random_string(tagKeys);
    return { tag };
  }
  const startDate = new Date(Date.UTC(2019, 0));
  function random_date(): string {
    const date = new Date(startDate.getTime() + Math.random() * (Date.now() - startDate.getTime()));
    return date.toUTCString();
  }

  const current = { line: 0, word: 0 };
  function next(eos: string, newLine: boolean = false): { sentence: string; newLine: boolean } | undefined {
    if (input.length === current.line) {
      return undefined;
    }
    const words: string[] = input[current.line];
    if (words.length > current.word) {
      return { sentence: words[current.word++] + eos, newLine };
    } else {
      ++current.line;
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
    return fetched ? fetched[0] : undefined;
  }
  function fetchDiscussion(discussionId: number): BareDiscussion | undefined {
    const title = fetchTitle();
    if (!title) {
      return undefined;
    }
    const tag: TagId = random_tag();
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
      id: discussionId,
      name: title,
      tags: [tag],
      first: messages[0],
      messages: messages.slice(1),
    };
  }

  const rc: BareDiscussion[] = [];
  for (let discussionId: number = 0; ; ++discussionId) {
    const discussion = fetchDiscussion(discussionId + 1);
    if (!discussion) {
      break;
    }
    rc.push(discussion);
  }

  // sort the messages by their dates (by assigning new messageId values to existing messages)
  const messagesDates: [Date, BareMessage][] = [];
  rc.forEach((discussion) => {
    messagesDates.push([new Date(discussion.first.dateTime), discussion.first]);
    discussion.messages.forEach((message) => messagesDates.push([new Date(message.dateTime), message]));
  });
  messagesDates.sort((x, y) => x[0].getTime() - y[0].getTime());
  messagesDates.forEach((pair, index) => {
    pair[1].messageId = index + 1;
  });

  // sort the discussions by their dates
  const discussionsDates: [Date, BareDiscussion][] = [];
  rc.forEach((discussion) => discussionsDates.push([new Date(discussion.first.dateTime), discussion]));
  discussionsDates.sort((x, y) => x[0].getTime() - y[0].getTime());
  discussionsDates.forEach((pair, index) => {
    pair[1].id = index + 1;
  });
  return discussionsDates.map((pair) => pair[1]);
}
