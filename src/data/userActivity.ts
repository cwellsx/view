import { TagCount } from "./tag";
import { UserSummary } from "./user";
import { DiscussionSummary } from "./discussion";
import { ActivityRange } from "./range";

// UserActivity is fetched separately because it's potentially long
export interface UserActivity {
  summary: UserSummary;
  range: ActivityRange;
  summaries: DiscussionSummary[];
  tagCounts: TagCount[];
}
