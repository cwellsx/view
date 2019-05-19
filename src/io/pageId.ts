import { IdName, Key } from "../data/Id";

/*
  This interface is able to represent any URL which exists within the system.

  I use it because I find it's difficult and not "type-safe" to work URL in string format
  e.g. if the URL scheme (i.e. the routes supported by the system) changes or expands.

  The PageId values defined in `route` represent the root pages for various types of data --
  these typically show an index or list:

  - /login
  - /sitemap
  - /users
  - /discussions
  - /tags
  
  The following type of route is optional, and may or may not be supported by a given site/installation,
  depending on whether any images are defined in the `prebuild_data`.

  - /images

  The system also supports the following URLs which are specific to different types of page.

  Users:

  - /users/<id>/<name>
  - /users/<id>/<name>?tab=profile
  - /users/<id>/<name>?tab=activity
  - /users/edit/<id>/<name>
  
  Discussions:

  - /discussions?sort=active
  - /discussions?sort=newest
  - /discussions/tagged/<key>

  ... other valid query parameters for the lists of discussions are:

  - pagesize=<size>
  - page=<number>

  Discussion:

  - /discussions/<id>/<name>
  - /discussions/<id>/<name>?answertab=active
  - /discussions/<id>/<name>?answertab=oldest

  Answer:

  - /a/<id2>
  
  ... redirects to ...

  - /discussions/<id>/<name>#id2

  Tags:

  - /discussions/tagged/<key>
  - /tags/<key>/info

  Images:

  - /images/<id>/<name>

  ---

  For any given data type (e.g. `User`) this module may export the following functions:

  UserPageOptions
  getUserPageUrl(options: UserPageOptions): string
  getUserPageOptions(url: string): UserPageOptions
*/

export type PageType = "SiteMap" | "Login" | "Discussion" | "User" | "Image" | "Feature";

export type PageIdWord = "tagged" | "edit";

export interface PageId {
  pageType: PageType;
  word?: PageIdWord;
  what?: IdName | Key;
  queries?: [string, string | undefined][];
}

// returned if there's an error parsing a URL
export interface PageIdError {
  error: string;
}

export function isPageIdError(rc: any | PageIdError): rc is PageIdError {
  return (rc as PageIdError).error !== undefined;
}

// subset of the Location which is exported by the "history" module
// and which is passed to routes in the ReactRouter.RouteComponentProps
interface Location {
  pathname: string;
  search: string;
}

function isLocation(location: Location | any): location is Location {
  return (location as Location).pathname !== undefined;
}

/*
  Helpers to convert between PageType and URL path
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

const pageTypeUrls = new Pairs<PageType, string>([
  ["SiteMap", "sitemap"],
  ["Login", "login"],
  ["Discussion", "discussions"],
  ["User", "users"],
  ["Image", "images"],
  ["Feature", "features"],
]);

const pageIdWords = new Pairs<PageType, PageIdWord[]>([
  ["User", ["edit"]],
  ["Discussion", ["tagged"]]
]);

function isPageIdWord(pageType: PageType, word: string): word is PageIdWord {
  const found = pageIdWords.find0(pageType);
  return !!found && found.includes(word as PageIdWord);
}

// from https://github.com/valeriangalliat/markdown-it-anchor/blob/master/index.js
const slugify = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))

function getIdName(idName: IdName): string {
  return `/${idName.id}/${slugify(idName.name)}`;
}

function getQuery(pageId: PageId, name: string): string | undefined {
  if (!pageId.queries) {
    return undefined;
  }
  const found = pageId.queries.find(x => x[0] === name);
  return (!!found) ? found[1] : undefined;
}

function toNumber(s: string): number | undefined {
  const rc: number = +s;
  return (typeof rc === "number") ? rc : undefined;
}

export function getOptionsValues<T, K extends keyof T>(options: T, keys: K[]): T[K][] {
  return keys.map(key => options[key]);
}

/*
  Extract the what? value
*/

function isWhatKey(what: IdName | Key): what is Key {
  return (what as Key).key !== undefined;
}

export function getPageIdNumber(pageId: PageId): number | undefined {
  return (pageId.what && !isWhatKey(pageId.what)) ? pageId.what.id : undefined;
}

export function getPageIdKey(pageId: PageId): string | undefined {
  return (pageId.what && isWhatKey(pageId.what)) ? pageId.what.key : undefined;
}

/*
  Convert a PageId to a URL
*/

export function getPageUrl(pageId: PageId): string {
  const root = pageTypeUrls.find0(pageId.pageType);
  if (!root) {
    throw new Error(`Undefined PageType: '${pageId.pageType}'`);
  }
  let url = `/${root}`;
  if (pageId.word) {
    url += `/${pageId.word}`;
  }
  if (pageId.what) {
    if (isWhatKey(pageId.what)) {
      url += `/${pageId.what.key}`;
    } else {
      url += `/${pageId.what.id}/${slugify(pageId.what.name)}`;
    }
  }
  if (pageId.queries && pageId.queries.length) {
    url += "?" + pageId.queries.map(pair => pair[1] ? pair[0] + "=" + pair[1] : pair[0]).join("&");
  }
  return url;
}

/*
  Convert a URL to a PageId
*/

function splitQueries(queries: string): [string, string | undefined][] {
  const split = queries.split("&");
  return split.filter(s => s.length > 0).map(s => {
    const parts = s.split("=");
    return (parts.length > 1) ? [parts[0], parts[1]] : [parts[0], undefined];
  });
}

interface SplitUrl {
  path: string[];
  queries: [string, string | undefined][];
};

export function splitLocation(location: Location): SplitUrl | PageIdError {
  let { pathname, search } = location;
  if (search && (search[0] !== "?")) {
    return { error: "Expected search to start with `?`" };
  }
  if (pathname[0] !== "/") {
    return { error: "Expected pathname to start with `/`" };
  }
  const path = pathname.substring(1).split("/");
  const queries = (search) ? splitQueries(search.substring(1)) : [];
  return { path, queries };
}

export function splitUrl(url: string): SplitUrl | PageIdError {
  if (url[0] !== "/") {
    return { error: "Expected URL to start with `/`" };
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

  return splitLocation({ pathname: url, search: query });
}

export function getPageId(split: SplitUrl | PageIdError): PageId | PageIdError {
  // the URL is already split by splitUrl or splitLocation
  if (isPageIdError(split)) {
    return split;
  }
  const { path, queries } = split;

  // get the PageType
  if (!path.length) {
    return { error: "Check for the root URL before calling getPageId" };
  }
  const pageType = pageTypeUrls.find1(path[0]);
  if (!pageType) {
    return { error: "Unknown page type" };
  };
  path.shift();

  // test for one of the well-known words
  function getWord(pageType: PageType): PageIdWord | undefined {
    if (!path.length) {
      return undefined;
    }
    const word = path[0];
    if (isPageIdWord(pageType, word)) {
      path.shift();
      return word;
    }
    return undefined;
  }
  const word = getWord(pageType);

  // get whatever
  let what = undefined;
  if (path.length) {
    switch (pageType) {
      case "User":
      case "Discussion":
      case "Image":
        // expect an IdName
        const id = toNumber(path[0]);
        if (!id) {
          return { error: `Expected ${path[0]} to be a numeric ID` };
        }
        if (path.length > 2) {
          return { error: `Unexpected extra elements in the path` };
        }
        const name = (path.length === 2) ? path[1] : "";
        what = { id, name };
        break;
      case "Feature":
        if (path.length !== 1) {
          return { error: `Unexpected extra elements in the path` };
        }
        what = { key: path[0] };
        break;
      default:
        return { error: `Unexpected extra elements in the path` };
    }
  }

  return { pageType, word, what, queries };
}

/*
  Simple routes for each of the various PageType values
*/

export const route = {
  login: getPageUrl({ pageType: "Login" }),
  siteMap: getPageUrl({ pageType: "SiteMap" }),
  discussions: getPageUrl({ pageType: "Discussion" }),
  users: getPageUrl({ pageType: "User" }),
  images: getPageUrl({ pageType: "Image" }),
}

/*
  Called from /src/io/index to contruct a PageId from input parameters, suitable for a request to the server
*/

export function requestPageId(pageType: PageType, id: number): PageId {
  return { pageType, what: { id, name: "unknown" } };
}

/*
  User page supports 3 tabs
*/

export type UserPageType = "Profile" | "EditSettings" | "Activity";

export function getUserPageUrl(userId: IdName, userPageType: UserPageType): string {
  switch (userPageType) {
    case "Profile":
      return getPageUrl({ pageType: "User", what: userId }) + "?tab=profile";
    case "EditSettings":
      return getPageUrl({ pageType: "User" }) + "/edit" + getIdName(userId);
    case "Activity":
      return getPageUrl({ pageType: "User", what: userId }) + "?tab=activity";
    default:
      throw new Error();
  }
}

export interface UserPageOptions { userId: number, userPageType: UserPageType };

function getUserPageType(pageId: PageId): UserPageType | PageIdError {
  if (pageId.word === "edit") {
    return "EditSettings";
  }
  const param = getQuery(pageId, "tab");
  switch (param) {
    case undefined:
    case "profile":
      return "Profile";
    case "activity":
      return "Activity";
    default:
      return { error: "Unexpected tab name" };
  }
}

export function getUserPageOptions(location: Location): UserPageOptions | PageIdError {
  const split = getPageId(splitLocation(location));
  if (isPageIdError(split)) {
    return split;
  }
  const pageId: PageId = split;
  const userId = getPageIdNumber(pageId);
  if (!userId) {
    return { error: "Expected a numeric userId" };
  }
  const userPageType = getUserPageType(pageId);
  if (isPageIdError(userPageType)) {
    return userPageType;
  }
  if (pageId.word === "edit") {
    return { userId, userPageType: "EditSettings" };
  }
  return { userId, userPageType };
}

/*
  Image page just has a numeric ID
*/

export function getPageIdImage(location: Location): { imageId: number } | PageIdError {
  const split = getPageId(splitLocation(location));
  if (isPageIdError(split)) {
    return split;
  }
  const pageId: PageId = split;
  if (pageId.pageType !== "Image") {
    return { error: "Expected an Image page type" };
  }
  const imageId = getPageIdNumber(pageId);
  if (!imageId) {
    return { error: "Expected a numeric userId" };
  }
  return { imageId };
}

/*
  Discussions page has two tabs
*/

export type DiscussionsSort = "Active" | "Newest";
export type DiscussionSort = "Oldest" | "Newest";
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

export interface DiscussionsPageOptions {
  sort?: DiscussionsSort;
  pagesize?: PageSize
  page?: number; //1-based
}

export function getDiscussionsPageId(options: DiscussionsPageOptions): PageId {
  const queries: [string, string | undefined][] = [];
  if (options.sort) {
    queries.push(["sort", discussionsSort.find0(options.sort)!]);
  }
  if (options.pagesize) {
    queries.push(["pagesize", "" + options.pagesize]);
  }
  if (options.page) {
    queries.push(["page", "" + options.page]);
  }
  return { pageType: "Discussion", queries };
}

export function getDiscussionsPageUrl(options: DiscussionsPageOptions): string {
  return getPageUrl(getDiscussionsPageId(options));
}

function ensurePageId(either: PageId | Location): PageId | PageIdError {
  return isLocation(either) ? getPageId(splitLocation(either)) : either;
}

export function getDiscussionsPageOptions(either: PageId | Location): DiscussionsPageOptions | PageIdError {
  const pageId = ensurePageId((either));
  if (isPageIdError(pageId)) {
    return pageId;
  }
  const sort = getQuery(pageId, "sort");
  const pagesize = getQuery(pageId, "pagesize");
  const page = getQuery(pageId, "page");
  return {
    sort: sort ? discussionsSort.find1(sort) : undefined,
    pagesize: pagesize ? pageSizes.find1(pagesize) : undefined,
    page: page ? toNumber(page) : undefined,
  };
}