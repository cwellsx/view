import { IdName } from "./Id";
import { TopicSummary } from "./TopicSummary";

export interface UserSummary {
  idName: IdName;
  gravatarHash: string;
  location?: string;
}

export interface UserSummaryEx extends UserSummary {
  topics?: TopicSummary[];
}