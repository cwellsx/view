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

/*
  Helpers to convert between PageType and URL path
*/

const pageTypeUrls: Array<[PageType, string]> = [
  ["SiteMap", "sitemap"],
  ["Login", "login"],
  ["Discussion", "discussions"],
  ["User", "users"],
  ["Image", "images"],
  ["Feature", "features"],
];

const pageIdWords: Array<[PageType, PageIdWord[]]> = [
  ["User", ["edit"]],
  ["Discussion", ["tagged"]]
];

function isPageIdWord(pageType: PageType, word: string): word is PageIdWord {
  const found = pageIdWords.find(x => x[0] === pageType);
  return !!found && found[1].includes(word as PageIdWord);
}

// from https://github.com/valeriangalliat/markdown-it-anchor/blob/master/index.js
const slugify = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))

function getPageUrlRoot(pageType: PageType): string {
  const found = pageTypeUrls.find((pair) => pair[0] === pageType);
  if (!found) {
    throw new Error(`Undefined PageType: '${pageType}'`);
  }
  return `/${found[1]}`;
}
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
  let url = getPageUrlRoot(pageId.pageType);
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
  hash: string | undefined
};

export function splitLocation(pathname: string, search?: string, hash?: string): SplitUrl | PageIdError {
  if (search) {
    if (search[0] !== "?") {
      return { error: "Expected search to start with `?`" };
    } else {
      search = search.substring(1);
    }
  }
  if (hash) {
    if (hash[0] !== "#") {
      return { error: "Expected hash to start with `#`" };
    } else {
      hash = hash.substring(1);
    }
  }
  if (pathname[0] !== "/") {
    return { error: "Expected pathname to start with `/`" };
  }
  const path = pathname.substring(1).split("/");
  const queries = (search) ? splitQueries(search) : [];
  return { path, queries, hash };
}

export function splitUrl(url: string): SplitUrl | PageIdError {
  if (url[0] !== "/") {
    return { error: "Expected URL to start with `/`" };
  }

  const splitHash = url.indexOf("#");
  const hash = (splitHash !== -1) ? url.substring(splitHash) : undefined;
  if (splitHash !== -1) {
    url = url.substring(0, splitHash);
  }

  const splitQuery = url.indexOf("?");
  const query = (splitQuery !== -1) ? url.substring(splitQuery) : undefined;
  if (splitQuery !== -1) {
    url = url.substring(0, splitQuery);
  }

  return splitLocation(url, query, hash);
}

export function getPageId(split: SplitUrl | PageIdError): PageId | PageIdError {
  // the URL is already split by splitUrl or splitLocation
  if (isPageIdError(split)) {
    return split;
  }
  const { path, queries, hash } = split;

  // get the PageType
  if (!path.length) {
    return { error: "Check for the root URL before calling getPageId" };
  }
  function getPagetype(): PageType | undefined {
    const found = pageTypeUrls.find(x => x[1] === path[0]);
    return found ? found[0] : undefined;
  }
  const pageType = getPagetype();
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
        if (typeof +path[0] !== "number") {
          return { error: `Expected ${path[0]} to be a numeric ID` };
        }
        if (path.length > 2) {
          return { error: `Unexpected extra elements in the path` };
        }
        const id = +path[0];
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
  Specialist functions to support the 3 tabs of a specific User page
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

export interface PageIdUser { userId: number, userPageType: UserPageType };

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

export function getPageIdUser(pathname: string, search: string): PageIdUser | PageIdError {
  const split = getPageId(splitLocation(pathname, search));
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
  Specialist function to support a specific Image page
*/

export function getPageIdImage(pathname: string): { imageId: number } | PageIdError {
  const split = getPageId(splitLocation(pathname));
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
