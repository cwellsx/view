import { IdName, Id } from "./Id";
import { UserSummary } from "./UserSummary";
import { TopicSummary } from "./TopicSummary";
import { getExerpt } from "./Exerpt";

export interface Message {
  userSummary: UserSummary;
  markdown: string;
  dateTime: string;
  exerpt: string;
}

export interface Discussion {
  meta: {
    idName: IdName;
    topicSummary: TopicSummary;
    owner: UserSummary; // equals the user of the first message
  };
  messages: Message[];
}

// slightly more compact form in which it's sent from server

export interface BareDiscussion {
  meta: {
    idName: IdName;
    topicSummary: TopicSummary;
  };
  messages: {
    userId: number; // + users
    markdown: string;
    dateTime: string;
    exerpt?: string;
  }[];
}

export interface WireDiscussion {
  users: UserSummary[];
  discussion: BareDiscussion;
}

export function unwireDiscussion(input: WireDiscussion): Discussion {
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(
    input.users.map(user => [user.idName.id, user])
  );

  const { meta, messages } = input.discussion;

  return {
    meta: {
      idName: meta.idName,
      topicSummary: meta.topicSummary,
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
