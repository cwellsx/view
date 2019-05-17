import { IdName } from "./Id";
import { UserSummary } from "./User";
import { TagId } from "./Tag";
import { DiscussionSummary } from "./Discussion";
import { Discussion } from "./Discussion";
import { getExerpt } from "./Exerpt";

// slightly more compact form in which it's sent from server
export interface WireDiscussionSummaries {
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
}

export function unwireDiscussionSummaries(input: WireDiscussionSummaries): DiscussionSummary[] {
  // create a Map of the users
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(
    input.users.map(user => [user.idName.id, user])
  );

  return input.discussions.map(wire => {
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
