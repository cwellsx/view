import { DiscussionsSort, DiscussionSort, ActivitySort } from "../shared/urls";

/*
  This is used to paginate the unlimited-length lists (e.g. of discussions) which are fetched
*/

interface Range<TSort> {
  nTotal: number;
  sort: TSort;
  pageSize: number;
  pageNumber: number; // 1-based
}

export type DiscussionRange = Range<DiscussionSort>;

export type DiscussionsRange = Range<DiscussionsSort>;

export type ActivityRange = Range<ActivitySort>;
