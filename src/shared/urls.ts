import { IdName, Key } from "../data";

/*
  This interface is able to represent any URL which exists within the system.

  I use it because I find it's difficult and not "type-safe" to work with URLs in string format
  e.g. if the URL scheme (i.e. the routes supported by the system) changes or expands.

  The full list of application URLs is defined by the list of Route and RouteT values defined below --
  (but) several of these also support additional search/query parameters).
*/

// User
const routeUsers: Route = { resourceType: "User" };
const routeUser: RouteT<IdName> = { resourceType: "User", parts: ["id", "name"] };
const routeUserEdit: RouteT<IdName> = { resourceType: "User", parts: ["edit", "id", "name"] };
// Image
const routeImages: Route = { resourceType: "Image" };
const routeImage: RouteT<IdName> = { resourceType: "Image", parts: ["id", "name"] };
// Discussion
const routeDiscussions: Route = { resourceType: "Discussion" };
const routeDiscussion: RouteT<IdName> = { resourceType: "Discussion", parts: ["id", "name"] };
// SiteMap
const routeSiteMap: Route = { resourceType: "SiteMap" };
// Tag
const routeAllTags: Route = { resourceType: "Tag", word: "all" };
const routeTags: Route = { resourceType: "Tag"};
const routeTagDiscussions: RouteT<Key> = { resourceType: "Discussion", parts: ["tagged", "key"] }
const routeTagInfo: RouteT<Key> = { resourceType: "Tag", parts: ["key", "info"] }
const routeTagEdit: RouteT<Key> = { resourceType: "Tag", parts: ["key", "edit"] }

// POST not GET
const routeLogin: Route = { resourceType: "Login" };
const routeNewDiscussion: Route = { resourceType: "Discussion", word: "new" };
const routeNewAnswer: RouteT<Id> = { resourceType: "Discussion", parts: ["id", "answer", "submit"] };
const routeEditUserProfile: RouteT<Id> = { resourceType: "User", parts: ["edit", "id"] };

/*
  Definitions of a route (see instances above) -- URLs contain:

  - a root directory which identifies the type of resource
  - other path seqgments which are either a keyword like "edit", and/or a replaceable element like {id} or {name}
*/

export type ResourceType = "SiteMap" | "Login" | "Discussion" | "User" | "Image" | "Tag";

type Keyword = "new" | "edit" | "tagged" | "info" | "answer" | "submit" | "all";

function isKeyword(s: Keyword | any): s is Keyword {
  switch (s) {
    case "new":
    case "edit":
    case "tagged":
    case "info":
    case "answer":
    case "submit":
    case "all":
      return true;
    default:
      return false;
  }
}

export type Parts<T extends object> = (Keyword | keyof T)[];

// a hard-coded URL without replaceable/variable segments
interface Route {
  resourceType: ResourceType;
  word?: Keyword;
}

// a URL which includes in its segments the element values of an identifier of type T
interface RouteT<T extends object> {
  resourceType: ResourceType;
  parts: Parts<T>;
}

/*
  isUrl, isUrlT -- test whether a URL matches a route

  makeUrl, makeUrlT -- make the URL for a given route
*/

function isUrlT<T extends object>(segments: string[], route: RouteT<T>): T | undefined {
  const { resourceType, parts } = route;
  if (!segments.length || (segments[0] !== getRoot(resourceType))) {
    return undefined;
  }
  if (segments.length !== 1 + parts.length) {
    return undefined;
  }
  let rc = {};
  for (let segmentIndex = 1, partIndex = 0; segmentIndex < segments.length; ++segmentIndex, ++partIndex) {
    const part = parts[partIndex];
    const segment = segments[segmentIndex];
    if (isKeyword(part)) {
      // it's a string
      if (segment !== part) {
        return undefined;
      }
      // it matched
      continue;
    }
    // else it's a key
    const key: keyof T = part;
    switch (key) {
      case "id":
        const id = toNumber(segment);
        if (!id) {
          return undefined;
        }
        rc = { ...rc, id };
        break;
      case "name":
        rc = { ...rc, name: segment };
        break;
      case "key":
        rc = { ...rc, key: segment };
        break;
      default:
        return undefined;
    }
  }
  return rc as T;
}

function isUrl(pathSegments: string[], route: Route): boolean {
  const { resourceType, word } = route;
  if (!pathSegments.length || (pathSegments[0] !== getRoot(resourceType))) {
    return false;
  }
  return (pathSegments.length === 1 && !word) || (pathSegments.length === 2 && pathSegments[1] === word);
}

function toNumber(s: string): number | undefined {
  const rc: number = +s;
  return (typeof rc === "number") ? rc : undefined;
}

// getTagText reuses this function
export function slugify(title: string) {
  // preserve only alphanumeric and whitespace and hyphen, then convert all whitespace, then toLower
  return title.replace(/[^A-Za-z0-9\- ]/g, "").replace(/ /g, "-").toLocaleLowerCase();
}

function makeUrlT<T extends object>(route: RouteT<T>, data: T, queries?: Queries): string {
  const { resourceType, parts } = route;
  const rc: string[] = [];
  rc.push(getRoot(resourceType));
  parts.forEach(part => {
    if (isKeyword(part)) {
      rc.push(part);
    } else {
      const key: keyof T = part;
      const value = "" + data[key]; // convert to string if it's a number
      const safe = (key === "name") ? resourceType === "User" ? encodeURIComponent(value) : slugify(value) : value;
      rc.push(safe);
    }
  })
  return "/" + rc.join("/") + (queries ? queries.search() : "");
}

function makeUrl(route: Route, queries?: Queries): string {
  const { resourceType, word } = route;
  const rc: string[] = [];
  rc.push(getRoot(resourceType));
  if (word) {
    rc.push(word);
  }
  return "/" + rc.join("/") + (queries ? queries.search() : "");
}

/*
  Helper to convert between URL fragments (used in the URL) and type string and numeric values (used in the code)

  They're similar but the URL uses lower-case strings, while the code uses upper-case type strings and number values.
*/

class Pairs<T0, T1> {
  readonly array: [T0, T1][];
  constructor(array: [T0, T1][]) {
    this.array = array;
  }
  find0(wanted: T0): T1 | undefined {
    const found = this.array.find(x => x[0] === wanted);
    return !!found ? found[1] : undefined;
  }
  find1(wanted: T1): T0 | undefined {
    const found = this.array.find(x => x[1] === wanted);
    return !!found ? found[0] : undefined;
  }
}

const resourceTypes = new Pairs<ResourceType, string>([
  ["SiteMap", "sitemap"],
  ["Login", "login"],
  ["Discussion", "discussions"],
  ["User", "users"],
  ["Image", "images"],
  ["Tag", "tags"],
]);

function getRoot(resourceType: ResourceType): string {
  const root = resourceTypes.find0(resourceType);
  if (!root) {
    throw new Error(`Undefined ResourceType: '${resourceType}'`);
  }
  return root;
}

export function getResourceType(location: Location): ResourceType | ParserError {
  const elements: Elements = new Elements(location);
  return elements.getResourceType();
}

/*
  Location

  Client-side code already has its URLs formatted as a location
  Server-side code needs a function to split a URL into a Location
*/

// subset of the Location which is exported by the "history" module
// and which is passed to routes in the ReactRouter.RouteComponentProps
export interface Location {
  pathname: string;
  search: string;
}

export function getLocation(url: string): Location {
  if (url[0] !== "/") {
    // this function is called on the server to parse a URL which the server code gets from the system run-time
    // it's not used to parse a URL received directly from a user application
    // so it's safe to say "this is impossile and shouldn't happen" and throw an exception, i.e. it's not something
    // that a malicious application might have sent us, and which we should handle without throwing an exception
    throw new Error("Expected URL to start with `/`");
  }

  const splitHash = url.indexOf("#");
  if (splitHash !== -1) {
    url = url.substring(0, splitHash);
  }

  const splitQuery = url.indexOf("?");
  const query = (splitQuery !== -1) ? url.substring(splitQuery) : "";
  if (splitQuery !== -1) {
    url = url.substring(0, splitQuery);
  }

  return { pathname: url, search: query };
}

/*
  Elements

  Splits the pathname and the search within a location to a more usable format
  A private implementation details used only within this module
*/

class Elements {
  private segments: string[];
  private queries: Queries;

  constructor(location: Location) {
    // split the input parameters
    const { pathname, search } = location;
    if (search && (search[0] !== "?")) {
      throw new Error("Expected search to start with `?`");
    }
    if (pathname[0] !== "/") {
      throw new Error("Expected pathname to start with `/`");
    }
    this.segments = (pathname.length === 1) ? [] : pathname.substring(1).split("/");
    this.queries = new Queries(location);
  }

  matchesT<T extends object>(route: RouteT<T>): T | undefined {
    return isUrlT(this.segments, route);
  }

  getQuery(name: string): string | undefined {
    return this.queries.get(name);
  }

  matches(route: Route): boolean {
    return isUrl(this.segments, route);
  }

  getResourceType(): ResourceType | ParserError {
    if (!this.segments.length) {
      return "SiteMap";
    }
    const resourceType = resourceTypes.find1(this.segments[0]);
    if (!resourceType) {
      return { error: `Undefined ResourceType: '${this.segments[0]}'` };
    }
    return resourceType;
  }
}

/*
  ParserError
  
  Returned if there's an error parsing a URL
  Used when parsing URLs which a server might receive from an application,
  so that a malicious application doesn't cause the server to throw an unhandled exception.
*/

export interface ParserError {
  error: string;
}

export function isParserError(rc: any | ParserError): rc is ParserError {
  return (rc as ParserError).error !== undefined;
}

const errorUnexpectedPath: ParserError = { error: "Unexpected path" };

/*
  Queries

  The optional query parameters (a.k.a. search parameters)
*/

class Queries {
  private params: [string, string | undefined][];

  constructor(location?: Location) {
    if (location && location.search) {
      const split = location.search.substring(1).split("&");
      this.params = split.filter(s => s.length > 0).map(s => {
        const parts = s.split("=");
        return (parts.length > 1) ? [parts[0], parts[1]] : [parts[0], undefined];
      });
    } else {
      this.params = [];
    }
  }

  get(name: string): string | undefined {
    const found = this.params.find(x => x[0] === name);
    return (!!found) ? found[1] : undefined;
  }
  push(name: string, value?: string): void {
    if (!value) {
      throw new Error("Unexpected undefined search value");
    }
    this.params.push([name, value]);
  }
  search(): string {
    return !this.params.length ? "" :
      "?" + this.params.map(pair => pair[1] ? pair[0] + "=" + pair[1] : pair[0]).join("&");
  }
}

/*
  User page supports 3 tabs
*/

const userTabTypes = new Pairs<UserTabType, string>([
  ["Profile", "profile"],
  ["Activity", "activity"],
]);

export type UserTabType = "Profile" | "EditSettings" | "Activity";
export interface UserOptions { user: IdName, userTabType?: UserTabType };

export type ActivitySort = "Oldest" | "Newest";
export interface UserActivityOptions {
  user: IdName;
  userTabType: "Activity";
  sort?: ActivitySort;
  page?: number; //1-based
};

export function isUsers(location: Location): boolean {
  const elements = new Elements(location);
  return elements.matches(routeUsers);
}

export function getUsersUrl(): string {
  return makeUrl(routeUsers);
}

export function isUserOptions(location: Location): UserOptions | ParserError {
  const elements = new Elements(location);
  let user: IdName | undefined = elements.matchesT(routeUserEdit);
  if (user) {
    return { user, userTabType: "EditSettings" };
  }
  user = elements.matchesT(routeUser);
  if (!user) {
    return errorUnexpectedPath;
  }
  const tab = elements.getQuery("tab");
  if (!tab) {
    return { user };
  }
  const userTabType: UserTabType | undefined = userTabTypes.find1(tab);
  if (!userTabType) {
    return { error: "Unexpected tab value" };
  }
  return { user, userTabType };
}

export function isUserActivityOptions(location: Location): UserActivityOptions | ParserError {
  const userOptions = isUserOptions(location);
  if (isParserError(userOptions)) {
    return userOptions;
  }
  const { user, userTabType } = userOptions;
  if (userTabType !== "Activity") {
    return { error: "Unexpected tab value" };
  }
  function getActivityoptions(queries: Queries) {
    const sort = queries.get("sort");
    const page = queries.get("page");
    return {
      sort: sort ? discussionSort.find1(sort) : undefined,
      page: page ? toNumber(page) : undefined
    };
  }
  const { sort, page } = getActivityoptions(new Queries(location));
  return { user, sort, userTabType, page };
}

export function getUserUrl(user: IdName): string {
  return makeUrlT(routeUser, user);
}

export function getUserOptionsUrl(options: UserOptions): string {
  if (options.userTabType === "EditSettings") {
    return makeUrlT(routeUserEdit, options.user);
  }
  const queries: Queries = new Queries();
  if (options.userTabType) {
    queries.push("tab", userTabTypes.find0(options.userTabType))
  }
  return makeUrlT(routeUser, options.user, queries);
}

export function getUserActivityUrl(options: UserActivityOptions): string {
  const queries: Queries = new Queries();
  queries.push("tab", userTabTypes.find0("Activity"))
  if (options.sort) {
    queries.push("sort", discussionSort.find0(options.sort));
  }
  if (options.page) {
    queries.push("page", "" + options.page);
  }
  return makeUrlT(routeUser, options.user, queries);
}

/*
  Image page just has a numeric ID
*/

export function isImage(location: Location): IdName | ParserError {
  const elements = new Elements(location);
  const image: IdName | undefined = elements.matchesT(routeImage);
  return image ? image : errorUnexpectedPath;
}

export function getImageUrl(image: IdName): string {
  return makeUrlT(routeImage, image);
}

/*
  Tabs page has two tabs (2 options)
*/

export type TagsSort = "Popular" | "Name";

const tagsSort = new Pairs<TagsSort, string>([
  ["Popular", "popular"],
  ["Name", "name"]
]);

export interface TagsOptions {
  sort?: TagsSort;
  pagesize: 36
  page?: number; //1-based
}

export function isTagsOptions(location: Location): TagsOptions | ParserError {
  const elements = new Elements(location);
  if (!elements.matches(routeTags)) {
    return errorUnexpectedPath;
  }
  const sort = elements.getQuery("sort");
  const page = elements.getQuery("page");
  return {
    sort: sort ? tagsSort.find1(sort) : undefined,
    pagesize: 36,
    page: page ? toNumber(page) : undefined,
  };
}

export function isAllTags(location: Location): boolean {
  const elements = new Elements(location);
  return elements.matches(routeAllTags);
}

export function getTagsOptionsUrl(params: { sort?: TagsSort, page?: number }): string {
  const options: TagsOptions = { ...params, pagesize: 36 }
  const queries: Queries = new Queries();
  if (options.sort) {
    queries.push("sort", tagsSort.find0(options.sort));
  }
  if (options.page) {
    queries.push("page", "" + options.page);
  }
  queries.push("pagesize", "" + options.pagesize);
  return makeUrl(routeTags, queries);
}

/*
  Discussions page has two tabs (3 options)
*/

export type DiscussionsSort = "Active" | "Newest";
export type PageSize = 15 | 30 | 50;

const discussionsSort = new Pairs<DiscussionsSort, string>([
  ["Active", "active"],
  ["Newest", "newest"]
]);

const pageSizes = new Pairs<PageSize, string>([
  [15, "15"],
  [30, "30"],
  [50, "50"]
]);

export interface DiscussionsOptions {
  sort?: DiscussionsSort;
  pagesize?: PageSize
  page?: number; //1-based
}

export function isDiscussionsOptions(location: Location): DiscussionsOptions | ParserError {
  const elements = new Elements(location);
  if (!elements.matches(routeDiscussions)) {
    return errorUnexpectedPath;
  }
  const sort = elements.getQuery("sort");
  const pagesize = elements.getQuery("pagesize");
  const page = elements.getQuery("page");
  return {
    sort: sort ? discussionsSort.find1(sort) : undefined,
    pagesize: pagesize ? pageSizes.find1(pagesize) : undefined,
    page: page ? toNumber(page) : undefined,
  };
}

export function getDiscussionsOptionsUrl(options: DiscussionsOptions): string {
  const queries: Queries = new Queries();
  if (options.sort) {
    queries.push("sort", discussionsSort.find0(options.sort));
  }
  if (options.pagesize) {
    queries.push("pagesize", "" + options.pagesize);
  }
  if (options.page) {
    queries.push("page", "" + options.page);
  }
  return makeUrl(routeDiscussions, queries);
}

/*
  Discussion page has two tabs
*/

export type DiscussionSort = "Oldest" | "Newest";

const discussionSort = new Pairs<DiscussionSort, string>([
  ["Oldest", "oldest"],
  ["Newest", "newest"]
]);

export interface DiscussionOptions {
  discussion: IdName;
  sort?: DiscussionSort;
  page?: number; //1-based
}

export function isDiscussionOptions(location: Location): DiscussionOptions | ParserError {
  const elements = new Elements(location);
  const discussion: IdName | undefined = elements.matchesT(routeDiscussion);
  if (!discussion) {
    return errorUnexpectedPath;
  }

  const sort = elements.getQuery("sort");
  const page = elements.getQuery("page");
  return {
    discussion,
    sort: sort ? discussionSort.find1(sort) : undefined,
    page: page ? toNumber(page) : undefined
  };
}

export function getDiscussionUrl(discussion: IdName): string {
  return makeUrlT(routeDiscussion, discussion);
}

export function getDiscussionOptionsUrl(options: DiscussionOptions): string {
  const queries = new Queries();
  if (options.sort) {
    queries.push("sort", discussionSort.find0(options.sort));
  }
  if (options.page) {
    queries.push("page", "" + options.page);
  }
  return makeUrlT(routeDiscussion, options.discussion, queries);
}

/*
  Tags
*/

export function getAllTagsUrl(): string { return makeUrl(routeAllTags); }
export function getTagsUrl(): string { return makeUrl(routeTags); }
export function getTagUrl(tag: Key): string { return getTagDiscussionsUrl(tag); }

export function getTagDiscussionsUrl(tag: Key): string { return makeUrlT(routeTagDiscussions, tag); }
export function getTagInfoUrl(tag: Key): string { return makeUrlT(routeTagInfo, tag); }
export function getTagEditUrl(tag: Key): string { return makeUrlT(routeTagEdit, tag); }

/*
  SiteMap
*/

export function getSiteMapUrl(): string { return makeUrl(routeSiteMap); }

/*
  Posts
*/

interface Id {
  id: number,
};

export function postLoginUrl(): string {
  return route.login;
}

export function postNewDiscussionUrl(): string {
  return route.newDiscussion;
}

export function postNewAnswerUrl(discussionId: number): string {
  return makeUrlT(routeNewAnswer, { id: discussionId });
}

export function postEditUserProfileUrl(userId: number): string {
  return makeUrlT(routeEditUserProfile, { id: userId });
}

export function isLogin(location: Location): boolean {
  const elements: Elements = new Elements(location);
  return elements.matches(routeLogin);
}

export function isNewDiscussion(location: Location): boolean {
  const elements: Elements = new Elements(location);
  return elements.matches(routeNewDiscussion);
}

export function isNewAnswer(location: Location): number | undefined {
  const elements: Elements = new Elements(location);
  const found = elements.matchesT(routeNewAnswer);
  return found ? found.id : undefined;
}

export function isEditUserProfile(location: Location): number | undefined {
  const elements: Elements = new Elements(location);
  const found = elements.matchesT(routeEditUserProfile);
  return found ? found.id : undefined;
}

/*
  Simple routes for each of the various ResourceType values
*/

export const route = {
  login: makeUrl(routeLogin),
  siteMap: makeUrl(routeSiteMap),
  discussions: makeUrl(routeDiscussions),
  users: makeUrl(routeUsers),
  images: makeUrl(routeImages),
  newDiscussion: makeUrl(routeNewDiscussion),
  tags: makeUrl(routeTags)
}
