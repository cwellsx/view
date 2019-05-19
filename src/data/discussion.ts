import { IdName } from "./id";
import { UserSummary } from "./user";
import { TagId } from "./tag";
import { DiscussionsSort } from "../shared/request";

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

export interface DiscussionsMeta {
  nTotal: number;
  sort: DiscussionsSort;
  pageSize: number;
  pageNumber: number; // 1-based
}

export interface Discussions {
  meta: DiscussionsMeta;
  summaries: DiscussionSummary[];
}
