import { IdName, Key } from "./id";
import { UserSummary } from "./user";
import { DiscussionsRange, DiscussionRange } from "./range";

export interface Message {
  userSummary: UserSummary;
  markdown: string;
  dateTime: string;
}

export interface Discussion {
  meta: {
    idName: IdName;
    tags: Key[];
  };
  // the owner of the discussion is the user associated with the first message
  first: Message;
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

export interface DiscussionSummary {
  idName: IdName;
  tags: Key[];
  messageSummary: MessageSummary;
  nAnswers: number;
}

export interface Discussions {
  range: DiscussionsRange;
  summaries: DiscussionSummary[];
}
