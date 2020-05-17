import { DiscussionSummary } from "./discussion";
import { ActivityRange } from "./range";
import { TagCount } from "./tag";
import { UserSummary } from "./user";

// UserActivity is fetched separately because it's potentially long
export interface UserActivity {
  summary: UserSummary;
  range: ActivityRange;
  summaries: DiscussionSummary[];
  tagCounts: TagCount[];
}
