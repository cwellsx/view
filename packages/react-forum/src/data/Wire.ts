import { IdName, Id } from "./Id";
import { PageType } from "../io/pageId";
import { UserSummary } from "./UserSummary";
import { TopicSummary } from "./TopicSummary";
import { DiscussionSummary } from "./DiscussionSummary";
import { Discussion } from "./Discussion";
import { getExerpt } from "./Exerpt";

// slightly more compact form in which it's sent from server
export interface WireDiscussionSummaries {
  users: UserSummary[];
  topics: TopicSummary[];
  discussions: {
    idName: IdName, // discussion ID
    userId: number, // + user ID
    // ownerId?: number, // plus ID of user who started the discussion, if this is a list of messages not of discussions
    topic: { id: Id, pageType: PageType },
    messageExerpt: string,
    dateTime: string,
    nAnswers: number
  }[];
}

export function unwireDiscussionSummaries(input: WireDiscussionSummaries): DiscussionSummary[] {
  const users: Map<number, UserSummary> = new Map<number, UserSummary>(
    input.users.map(user => [user.idName.id, user])
  );

  const topics: Map<PageType, Map<number, string>> = new Map<PageType, Map<number, string>>();
  input.topics.forEach(topic => {
    if (!topics.has(topic.pageType)) {
      topics.set(topic.pageType, new Map<number, string>());
    }
    topics.get(topic.pageType)!.set(topic.idName.id, topic.idName.name);
  });

  function getTopicSummary(id: Id, pageType: PageType): TopicSummary {
    return {
      idName: {
        id: id,
        name: topics.get(pageType)!.get(id)!
      },
      pageType: pageType
    };
  }

  return input.discussions.map(wire => {
    return {
      idName: wire.idName,
      topicSummary: getTopicSummary(wire.topic.id, wire.topic.pageType),
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
    topicSummary: TopicSummary;
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
