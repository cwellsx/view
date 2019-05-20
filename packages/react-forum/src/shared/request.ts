import { IdName, Key } from "../data/id";

/*
  This interface is able to represent any URL which exists within the system.

  I use it because I find it's difficult and not "type-safe" to work URL in string format
  e.g. if the URL scheme (i.e. the routes supported by the system) changes or expands.

  The Resource values defined in `route` represent the root pages for various types of data --
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

  UserOptions
  getUserUrl(options: UserOptions): string
  getUserOptions(url: string): UserOptions
*/

export type ResourceType = "SiteMap" | "Login" | "Discussion" | "User" | "Image" | "Feature";

export type ResourceWord = "tagged" | "edit";

export interface Resource {
  resourceType: ResourceType;
  word?: ResourceWord;
  what?: IdName | Key;
  queries?: [string, string | undefined][];
}

// returned if there's an error parsing a URL
export interface ParserError {
  error: string;
}

export function isParserError(rc: any | ParserError): rc is ParserError {
  return (rc as ParserError).error !== undefined;
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
  Helpers to convert between ResourceType and URL path
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
  ["Feature", "features"],
]);

const resourceWords = new Pairs<ResourceType, ResourceWord[]>([
  ["User", ["edit"]],
  ["Discussion", ["tagged"]]
]);

function isResourceWord(resourceType: ResourceType, word: string): word is ResourceWord {
  const found = resourceWords.find0(resourceType);
  return !!found && found.includes(word as ResourceWord);
}

// from https://github.com/valeriangalliat/markdown-it-anchor/blob/master/index.js
const slugify = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))

function getQuery(resource: Resource, name: string): string | undefined {
  if (!resource.queries) {
    return undefined;
  }
  const found = resource.queries.find(x => x[0] === name);
  return (!!found) ? found[1] : undefined;
}

function toNumber(s: string): number | undefined {
  const rc: number = +s;
  return (typeof rc === "number") ? rc : undefined;
}

/*
  Extract the what? value
*/

function isWhatKey(what: IdName | Key): what is Key {
  return (what as Key).key !== undefined;
}

function getResourceId(resource: Resource): IdName | undefined {
  return (resource.what && !isWhatKey(resource.what)) ? resource.what : undefined;
}

function getResourceKey(resource: Resource): Key | undefined {
  return (resource.what && isWhatKey(resource.what)) ? resource.what : undefined;
}

/*
  Convert a Resource to a URL
*/

export function getResourceUrl(resource: Resource): string {
  const root = resourceTypes.find0(resource.resourceType);
  if (!root) {
    throw new Error(`Undefined PageType: '${resource.resourceType}'`);
  }
  let url = `/${root}`;
  if (resource.word) {
    url += `/${resource.word}`;
  }
  if (resource.what) {
    if (isWhatKey(resource.what)) {
      url += `/${resource.what.key}`;
    } else {
      url += `/${resource.what.id}/${slugify(resource.what.name)}`;
    }
  }
  if (resource.queries && resource.queries.length) {
    url += "?" + resource.queries.map(pair => pair[1] ? pair[0] + "=" + pair[1] : pair[0]).join("&");
  }
  return url;
}

/*
  Convert a URL to a Resource
*/

function splitQueries(queries: string): [string, string | undefined][] {
  const split = queries.split("&");
  return split.filter(s => s.length > 0).map(s => {
    const parts = s.split("=");
    return (parts.length > 1) ? [parts[0], parts[1]] : [parts[0], undefined];
  });
}

function makeResource(location: Location): Resource | ParserError {
  // split the input parameters
  const { pathname, search } = location;
  if (search && (search[0] !== "?")) {
    return { error: "Expected search to start with `?`" };
  }
  if (pathname[0] !== "/") {
    return { error: "Expected pathname to start with `/`" };
  }
  const path: string[] = pathname.substring(1).split("/");
  const queries: [string, string | undefined][] = (search) ? splitQueries(search.substring(1)) : [];

  // get the ResourceType
  if (!path.length) {
    return { error: "Check for the root URL before calling getPageId" };
  }
  const resourceType = resourceTypes.find1(path[0]);
  if (!resourceType) {
    return { error: "Unknown page type" };
  };
  path.shift();

  // test for one of the well-known words
  function getWord(resourceType: ResourceType): ResourceWord | undefined {
    if (!path.length) {
      return undefined;
    }
    const word = path[0];
    if (isResourceWord(resourceType, word)) {
      path.shift();
      return word;
    }
    return undefined;
  }
  const word = getWord(resourceType);

  // get whatever
  let what = undefined;
  if (path.length) {
    switch (resourceType) {
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

  return { resourceType: resourceType, word, what, queries };
}

function ensureResource(either: Resource | Location): Resource | ParserError {
  return isLocation(either) ? makeResource(either) : either;
}

export function getResource(url: string): Resource | ParserError {
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

  const location: Location = { pathname: url, search: query };
  return makeResource(location);
}

/*
  Simple routes for each of the various ResourceType values
*/

export const route = {
  login: getResourceUrl({ resourceType: "Login" }),
  siteMap: getResourceUrl({ resourceType: "SiteMap" }),
  discussions: getResourceUrl({ resourceType: "Discussion" }),
  users: getResourceUrl({ resourceType: "User" }),
  images: getResourceUrl({ resourceType: "Image" }),
}

/*
  Called from /src/io/index to contruct a Resource from input parameters, suitable for a request to the server
*/

export function requestResource(resourceType: ResourceType, id: number): Resource {
  return { resourceType, what: { id, name: "unknown" } };
}

/*
  User page supports 3 tabs
*/

export type UserTabType = "Profile" | "EditSettings" | "Activity";

export function getUserUrl(userId: IdName, userTabType: UserTabType): string {
  switch (userTabType) {
    case "Profile":
      return getResourceUrl({ resourceType: "User", what: userId, queries: [["tab", "profile"]] });
    case "EditSettings":
      return getResourceUrl({ resourceType: "User", word: "edit", what: userId });
    case "Activity":
      return getResourceUrl({ resourceType: "User", what: userId, queries: [["tab", "activity"]] });
    default:
      throw new Error();
  }
}

export interface UserOptions { user: IdName, userTabType: UserTabType };

function getUserTabType(resource: Resource): UserTabType | ParserError {
  if (resource.word === "edit") {
    return "EditSettings";
  }
  const param = getQuery(resource, "tab");
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

export function getUserOptions(either: Resource | Location): UserOptions | ParserError {
  const resource = ensureResource((either));
  if (isParserError(resource)) {
    return resource;
  }
  const user = getResourceId(resource);
  if (!user) {
    return { error: "Expected a numeric userId" };
  }
  const userTabType = getUserTabType(resource);
  if (isParserError(userTabType)) {
    return userTabType;
  }
  return { user, userTabType };
}

/*
  Image page just has a numeric ID
*/

export interface ImageOptions { image: IdName };

export function getImageOptions(either: Resource | Location): ImageOptions | ParserError {
  const resource = ensureResource((either));
  if (isParserError(resource)) {
    return resource;
  }
  if (resource.resourceType !== "Image") {
    return { error: "Expected an Image page type" };
  }
  const image = getResourceId(resource);
  if (!image) {
    return { error: "Expected a numeric imageId" };
  }
  return { image };
}

/*
  Discussions page has two tabs
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

export function getDiscussionsResource(options: DiscussionsOptions): Resource {
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
  return { resourceType: "Discussion", queries };
}

export function getDiscussionsUrl(options: DiscussionsOptions): string {
  return getResourceUrl(getDiscussionsResource(options));
}

export function getDiscussionsOptions(either: Resource | Location): DiscussionsOptions | ParserError {
  const resource = ensureResource((either));
  if (isParserError(resource)) {
    return resource;
  }
  const sort = getQuery(resource, "sort");
  const pagesize = getQuery(resource, "pagesize");
  const page = getQuery(resource, "page");
  return {
    sort: sort ? discussionsSort.find1(sort) : undefined,
    pagesize: pagesize ? pageSizes.find1(pagesize) : undefined,
    page: page ? toNumber(page) : undefined,
  };
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

export function getDiscussionResource(options: DiscussionOptions): Resource {
  const queries: [string, string | undefined][] = [];
  if (options.sort) {
    queries.push(["sort", discussionSort.find0(options.sort)!]);
  }
  if (options.page) {
    queries.push(["page", "" + options.page]);
  }
  return { resourceType: "Discussion", what: options.discussion, queries };
}

export function getDiscussionUrl(options: DiscussionOptions): string {
  return getResourceUrl(getDiscussionResource(options));
}

export function getDiscussionOptions(either: Resource | Location): DiscussionOptions | ParserError {
  const resource = ensureResource((either));
  if (isParserError(resource)) {
    return resource;
  }
  const discussion = getResourceId(resource);
  if (!discussion) {
    return { error: "Expected a numeric discussionId" };
  }
  const sort = getQuery(resource, "sort");
  const page = getQuery(resource, "page");
  return {
    discussion,
    sort: sort ? discussionSort.find1(sort) : undefined,
    page: page ? toNumber(page) : undefined
  };
}
