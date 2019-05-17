import { IdName } from "./Id";
import { PageType } from "../io/pageId";
import { UserSummary } from "./User";
import { DiscussionSummary } from "./Discussion";

export interface FavouriteId {
  pageType: PageType;
  idName: IdName;
}

// UserActivity is fetched separately because it's potentially long
export interface UserActivity {
  summary: UserSummary;
  messages: DiscussionSummary[];
  favourites: FavouriteId[];
}
