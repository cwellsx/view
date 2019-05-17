import { IdName } from "./Id";
import { UserSummary } from "./User";
import { TagId } from "./Tag";

export interface Message {
  userSummary: UserSummary;
  markdown: string;
  dateTime: string;
  exerpt: string;
}

export interface Discussion {
  meta: {
    idName: IdName;
    tag: TagId;
    owner: UserSummary; // equals the user of the first message
  };
  messages: Message[];
}

/*
  Summaries
*/

export interface MessageSummary {
  userSummary: UserSummary;
  messageExerpt: string;
  dateTime: string;
}

export interface DiscussionSummary {
  idName: IdName;
  tag: TagId;
  messageSummary: MessageSummary;
  nAnswers: number;
}
