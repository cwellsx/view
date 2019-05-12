import { IdName } from "../data/Id";

export type PageType = "SiteMap" | "Login" | "Discussion" | "User" | "Image" | "Feature";

const pageTypeUrls: Array<[PageType, string]> = [
  ["SiteMap", "sitemap"],
  ["Login", "login"],
  ["Discussion", "discussions"],
  ["User", "users"],
  ["Image", "images"],
  ["Feature", "features"],
];

export interface PageId {
  pageType: PageType;
  id?: IdName[] | IdName;
  other?: string[];
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

export function getPageUrl(pageId: PageId): string {
  let url = getPageUrlRoot(pageId.pageType);
  function addIdName(idName: IdName) { url += getIdName(idName); }
  if (pageId.id) {
    if (Array.isArray(pageId.id)) {
      pageId.id.forEach(addIdName);
    } else {
      addIdName(pageId.id);
    }
  }
  return url;
}

function splitPathStart(pathname: string, pageType: PageType): string[] {
  const start = getPageUrl({ pageType }) + "/";
  if (!pathname.startsWith(start)) {
    throw new Error(`Path '${pathname}' was expected to start with '${start}'`);
  }
  const split = pathname.substring(start.length).split("/");
  if (!split.length) {
    throw new Error(`No subpath: ${pathname}`);
  }
  if (split.some((s) => !s.length)) {
    throw new Error(`Malformed subpath: ${pathname}`);
  }
  return split;
}

export function splitPath(pathname: string, pageType: PageType): Array<string | number> {
  const split = splitPathStart(pathname, pageType);
  const rc: Array<string | number> = [];
  split.forEach((s) => {
    // https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
    const n: number = +s;
    rc.push(isNaN(n) ? s : n);
  });
  return rc;
}

export function isNumber(subpath: string | number): subpath is number {
  return (typeof subpath === "number");
}

export function postPageId(pageType: PageType, id: number): PageId {
  return { pageType, id: { id, name: "unknown" } };
}

export const route = {
  login: getPageUrl({ pageType: "Login" }),
  siteMap: getPageUrl({ pageType: "SiteMap" }),
  discussions: getPageUrl({ pageType: "Discussion" }),
  users: getPageUrl({ pageType: "User" }),
  images: getPageUrl({ pageType: "Image" }),
}

export type UserPageType = "Profile" | "EditSettings" | "Activity";

export function getUserPageUrl(userId: IdName, userPageType: UserPageType): string {
  switch (userPageType) {
    case "Profile":
      return getPageUrl({ pageType: "User", id: userId }) + "?tab=profile";
    case "EditSettings":
      return getPageUrl({ pageType: "User" }) + "/edit" + getIdName(userId);
    case "Activity":
      return getPageUrl({ pageType: "User", id: userId }) + "?tab=activity";
    default:
      throw new Error();
  }
}

export function splitPathUser(pathname: string, search: string): { userId: number, userPageType: UserPageType } {
  const split = splitPathStart(pathname, "User");
  function getId(s: string): number {
    const n: number = +s;
    if (isNaN(n) && !n) {
      throw new Error(`Not an Id number: ${s}`);
    }
    return n;
  }
  if (split[0] === "edit") {
    return { userId: getId(split[1]), userPageType: "EditSettings" };
  }
  function getTab(): string | undefined {
    if (!search.startsWith("?")) {
      return undefined;
    }
    const found = search.substring(1).split("&").find(s => s.startsWith("tab="));
    return (found) ? found.substring(4) : undefined;
  }
  const param = getTab();
  const userPageType: UserPageType | undefined = (!param)
    ? "Profile"
    : param === "profile"
      ? "Profile"
      : param === "activity"
        ? "Activity"
        : undefined;
  if (!userPageType) {
    throw new Error(`Unexpected tab: ${param}`);
  }
  return { userId: getId(split[0]), userPageType };
}