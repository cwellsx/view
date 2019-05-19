import { IdName } from "../data/id";
import { UserSummary } from "../data/user";
import { TagId } from "../data/tag";
import { DiscussionSummary, Discussions, DiscussionsMeta } from "../data/discussion";
import { Discussion } from "../data/discussion";
import { getExerpt } from "./exerpt";

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
  meta: DiscussionsMeta;
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

  return { summaries, meta: input.meta };
}

// slightly more compact form in which it's sent from server

export interface WireDiscussion {
  users: UserSummary[];
  meta: {
    idName: IdName;
    tag: TagId;
  };
  messages: {
    userId: number; // + users
    markdown: string;
    dateTime: string;
    exerpt?: string;
  }[];
}

export function unwireDiscussion(input: WireDiscussion): Discussion {
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(
    input.users.map(user => [user.idName.id, user])
  );

  const { meta, messages } = input;

  return {
    meta: {
      idName: meta.idName,
      tag: meta.tag,
      owner: users.get(messages[0].userId)!
    },
    messages: messages.map(wire => {
      return {
        userSummary: users.get(wire.userId)!,
        markdown: wire.markdown,
        dateTime: wire.dateTime,
        exerpt: wire.exerpt ? wire.exerpt : getExerpt(wire.markdown)
      };
    })
  };
}
