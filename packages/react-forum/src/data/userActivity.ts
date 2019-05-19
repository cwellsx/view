import { IdName } from "./id";
import { ResourceType } from "../shared/request";
import { UserSummary } from "./user";
import { DiscussionSummary } from "./discussion";

export interface FavouriteId {
  resourceType: ResourceType;
  idName: IdName;
}

// UserActivity is fetched separately because it's potentially long
export interface UserActivity {
  summary: UserSummary;
  messages: DiscussionSummary[];
  favourites: FavouriteId[];
}
