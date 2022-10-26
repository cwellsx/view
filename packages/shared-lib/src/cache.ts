import * as Data from './data';
import * as Url from './urls';

export interface Cache {
  // methods to get data
  getSiteMap?: Cached<Data.SiteMap>;
  getImage?: CachedT<Data.IdName, Data.Image>;
  getUsers?: Cached<Data.UserSummaryEx[]>;
  getUser?: CachedT<Data.IdName, Data.User>;
  getUserActivity?: CachedT<Url.UserActivityOptions, Data.UserActivity>;
  getDiscussions?: CachedT<Url.DiscussionsOptions, Data.Discussions>;
  getDiscussion?: CachedT<Url.DiscussionOptions, Data.Discussion>;
  getAllTags?: Cached<Data.TagCount[]>;
  getTags?: CachedT<Url.TagsOptions, Data.Tags>;
  getTag?: CachedT<Data.Key, Data.TagInfo>;
  getPublic?: CachedT<string, string>;
}

/*
  These classes implement a simplistic cache suitable for server-side rendering
  They erase the data when it's read for the first time (i.e. when the page first loads)
  to guarantee the application won't display stale data later.
  
  Another more sophisiticated implmentation could cache the data for some time etc.
*/

export class CachedT<TParam, TData> {
  private readonly param: TParam;
  private data?: TData;
  constructor(param: TParam, data: TData) {
    this.param = param;
    this.data = data;
  }
  fetch(): TData | undefined {
    const data = this.data;
    this.data = undefined;
    return data;
  }
  matches(param: TParam): boolean {
    // just an assertion, and assumes that even if TParam is an object its values are all scalars
    if (typeof param === "object") {
      for (const key in param) {
        if (param[key] !== this.param[key]) return false;
      }
      return true;
    }
    return param === this.param;
  }
}

const isVoid: void = (() => {})();

// when there's no parameter
export class Cached<TData> extends CachedT<void, TData> {
  constructor(data: TData) {
    super(isVoid, data);
  }
  matches(param: void): boolean {
    return true;
  }
}
