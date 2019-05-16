import { IdName, Id } from "./Id";
import { UserSummary } from "./UserSummary";
import { TopicSummary } from "./TopicSummary";

export interface MessageSummary {
  userSummary: UserSummary;
  messageExerpt: string;
  dateTime: string;
}

export interface DiscussionSummary {
  idName: IdName;
  topicSummary: TopicSummary;
  messageSummary: MessageSummary;
  nAnswers: number;
}
