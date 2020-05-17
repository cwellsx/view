import { Discussion, DiscussionMeta, Discussions, DiscussionSummary, Message } from "../data/discussion";
import { Key } from "../data/id";
import { ActivityRange, DiscussionRange, DiscussionsRange } from "../data/range";
import { TagCount } from "../data/tag";
import { UserSummary } from "../data/user";
import { UserActivity } from "../data/userActivity";

/*
  This defines slightly more compact forms for various types of data, in which the data is sent from the server.
  It just ensures that only one instance of each UserSummary is sent, even when several messages are from the same user.
*/

export interface WireSummaries {
  users: UserSummary[];
  discussions: {
    id: number;
    name: string;
    tags: Key[];
    userId: number; // + user ID
    // ownerId?: number, // plus ID of user who started the discussion, if this is a list of messages not of discussions
    messageExerpt: string;
    dateTime: string;
    nAnswers: number;
  }[];
}

function unwireSummaries(input: WireSummaries): DiscussionSummary[] {
  // create a Map of the users
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(input.users.map((user) => [user.id, user]));

  const summaries: DiscussionSummary[] = input.discussions.map((wire) => {
    return {
      id: wire.id,
      name: wire.name,
      tags: wire.tags,
      messageSummary: {
        userSummary: users.get(wire.userId)!,
        messageExerpt: wire.messageExerpt,
        dateTime: wire.dateTime,
      },
      nAnswers: wire.nAnswers,
    };
  });

  return summaries;
}

/*
  WireDiscussions <-> Discussions
*/

export type WireDiscussions = WireSummaries & { range: DiscussionsRange };

export function unwireDiscussions(input: WireDiscussions): Discussions {
  const summaries = unwireSummaries(input);
  return { range: input.range, summaries };
}

/*
  WireDiscussion <-> Discussion
*/

export interface WireMessage {
  messageId: number;
  userId: number; // + users
  markdown: string;
  dateTime: string;
}

export interface WireDiscussion extends DiscussionMeta {
  users: UserSummary[];
  first: WireMessage;
  range: DiscussionRange;
  messages: WireMessage[];
}

export function unwireDiscussion(input: WireDiscussion): Discussion {
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(input.users.map((user) => [user.id, user]));

  const { id, name, tags, range, first, messages } = input;

  function unwireMessage(wire: WireMessage): Message {
    return {
      userSummary: users.get(wire.userId)!,
      markdown: wire.markdown,
      dateTime: wire.dateTime,
    };
  }

  return {
    id,
    name,
    tags,
    first: unwireMessage(first),
    range: range,
    messages: messages.map(unwireMessage),
  };
}

/*
  WireUserActivity <-> UserActivity
*/

export interface WireUserActivity extends WireSummaries {
  range: ActivityRange;
  tagCounts: TagCount[];
}

export function unwireUserActivity(input: WireUserActivity): UserActivity {
  const summaries = unwireSummaries(input);
  const summary: UserSummary = input.users[0];
  const range = input.range;
  return { summary, summaries, tagCounts: input.tagCounts, range };
}
