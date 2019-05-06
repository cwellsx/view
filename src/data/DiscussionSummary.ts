import { IdName, Id } from "./Id";
import { UserSummary } from "./UserSummary";
import { TopicSummary } from "./TopicSummary";
import { PageType } from "../io/pageId";

export interface MessageSummary {
  userSummary: UserSummary;
  messageExerpt: string;
  dateTime: string;
}

export interface DiscussionSummary {
  idName: IdName;
  topicSummary: TopicSummary;
  messageSummary: MessageSummary;
}

// slightly more compact form in which it's sent from server
export interface BareDiscussionSummary {
  idName: IdName, // discussion ID
  userId: number, // + users
  topic: { id: Id, pageType: PageType },
  messageExerpt: string,
  dateTime: string
}
export interface WireDiscussionSummary {
  users: UserSummary[];
  topics: TopicSummary[];
  discussions: BareDiscussionSummary[];
}

export function unwireDiscussionSummary(input: WireDiscussionSummary): DiscussionSummary[] {
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
      }
    };
  });
}