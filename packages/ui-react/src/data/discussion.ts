import { IdName, Key } from "./id";
import { UserSummary } from "./user";
import { DiscussionsRange, DiscussionRange } from "./range";

export interface Message {
  userSummary: UserSummary;
  markdown: string;
  dateTime: string;
}

export interface DiscussionMeta extends IdName {
  tags: Key[];
}

export interface Discussion extends DiscussionMeta {
  // the owner of the discussion is the user associated with the first message
  first: Message;
  // we don't necessarily return all the messages whch actually exist in the discussion
  range: DiscussionRange;
  messages: Message[];
}

/*
  Summaries
*/

// like Message except only an exerpt
export interface MessageSummary {
  userSummary: UserSummary;
  messageExerpt: string;
  dateTime: string;
}

export interface DiscussionSummary extends DiscussionMeta {
  messageSummary: MessageSummary;
  nAnswers: number;
}

export interface Discussions {
  range: DiscussionsRange;
  summaries: DiscussionSummary[];
}
