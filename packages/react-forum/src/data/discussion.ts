import { IdName } from "./id";
import { UserSummary } from "./user";
import { TagId } from "./tag";
import { DiscussionsSort, DiscussionSort } from "../shared/request";

export interface Message {
  userSummary: UserSummary;
  markdown: string;
  dateTime: string;
}

export interface Discussion {
  meta: {
    idName: IdName;
    tag: TagId;
    owner: UserSummary; // equals the user of the first message
  };
  first: Message;
  range: DiscussionRange;
  messages: Message[];
}

export interface DiscussionRange {
  nTotal: number;
  sort: DiscussionSort;
  pageSize: number;
  pageNumber: number; // 1-based
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

export interface DiscussionsRange {
  nTotal: number;
  sort: DiscussionsSort;
  pageSize: number;
  pageNumber: number; // 1-based
}

export interface Discussions {
  range: DiscussionsRange;
  summaries: DiscussionSummary[];
}
