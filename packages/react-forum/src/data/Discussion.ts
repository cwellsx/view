import { IdName, Id } from "./Id";
import { UserSummary } from "./UserSummary";
import { TopicSummary } from "./TopicSummary";

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
