import { IdName } from "../data/id";
import { UserSummary } from "../data/user";
import { TagId } from "../data/tag";
import { DiscussionSummary, Discussions, DiscussionsRange, DiscussionRange, Message } from "../data/discussion";
import { Discussion } from "../data/discussion";

// slightly more compact form in which it's sent from server
export interface WireDiscussions {
  users: UserSummary[];
  discussions: {
    idName: IdName, // discussion ID
    tag: TagId,
    userId: number, // + user ID
    // ownerId?: number, // plus ID of user who started the discussion, if this is a list of messages not of discussions
    messageExerpt: string,
    dateTime: string,
    nAnswers: number
  }[];
  range: DiscussionsRange;
}

export function unwireDiscussions(input: WireDiscussions): Discussions {
  // create a Map of the users
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(
    input.users.map(user => [user.idName.id, user])
  );

  const summaries: DiscussionSummary[] = input.discussions.map(wire => {
    return {
      idName: wire.idName,
      tag: wire.tag,
      messageSummary: {
        userSummary: users.get(wire.userId)!,
        messageExerpt: wire.messageExerpt,
        dateTime: wire.dateTime
      },
      nAnswers: wire.nAnswers
    };
  });

  return { summaries, range: input.range };
}

// slightly more compact form in which it's sent from server

export interface WireMessage {
  userId: number; // + users
  markdown: string;
  dateTime: string;
}

export interface WireDiscussionMeta {
  idName: IdName;
  tag: TagId;
}

export interface WireDiscussion {
  users: UserSummary[];
  meta: WireDiscussionMeta;
  first: WireMessage;
  range: DiscussionRange;
  messages: WireMessage[];
}

export function unwireDiscussion(input: WireDiscussion): Discussion {
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(
    input.users.map(user => [user.idName.id, user])
  );

  const { meta, range, first, messages } = input;

  function unwireMessage(wire: WireMessage): Message {
    return {
      userSummary: users.get(wire.userId)!,
      markdown: wire.markdown,
      dateTime: wire.dateTime
    };
  }

  return {
    meta: {
      idName: meta.idName,
      tag: meta.tag,
      owner: users.get(first.userId)!
    },
    first: unwireMessage(first),
    range: range,
    messages: messages.map(unwireMessage)
  };
}
