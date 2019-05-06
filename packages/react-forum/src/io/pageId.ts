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

export function getPageUrl(pageId: PageId): string {
  const found = pageTypeUrls.find((pair) => pair[0] === pageId.pageType);
  if (!found) {
    throw new Error(`Undefined PageType: '${pageId.pageType}'`);
  }
  let url = `/${found[1]}`;
  function addIdName(idName: IdName) { url += `/${idName.id}/${slugify(idName.name)}`; }
  if (pageId.id) {
    if (Array.isArray(pageId.id)) {
      pageId.id.forEach(addIdName);
    } else {
      addIdName(pageId.id);
    }
  }
  return url;
}

export function splitPath(pathname: string, pageType: PageType): Array<string | number> {
  const start = getPageUrl({pageType}) + "/";
  if (!pathname.startsWith(start)) {
    throw new Error(`Path '${pathname}' was expected to start with '${start}'`);

  }
  const split: string[] = pathname.substring(start.length).split("/");
  if (!split.length) {
    throw new Error(`No subpath: ${pathname}`);
  }
  if (split.some((s) => !s.length)) {
    throw new Error(`Malformed subpath: ${pathname}`);
  }
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
  return { pageType, id: { id, name: "unknown" }};
}

/*
export function getPageId(pathname: string): PageId | undefined {
  const found = pageTypeUrls.find((pair) => pathname.startsWith(`/${pair[1]}`));
  if (!found) {
    return undefined;
  }
  let trimmed = pathname.substring(1 + found[1].length);
  const pageType: PageType = found[0];
  if (!trimmed.length || (trimmed === "/")) {
    return { pageType };
  }
  if (trimmed[0] !== "/") {
    return undefined;
  }
  const split: string[] = trimmed.substring(1).split("/");
  if (!split.length || split.some((s) => !s.length)) {
    return undefined;
  }
  // https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
  const first = split[0];
  const second = (split.length > 1) ? split[1] : "";
  if (!isNaN(+first)) {
    const idName: IdName = { id: +first, name: second };
    return { pageType, id: idName };
  } else {
    return { pageType, other: split };
  }
}
*/

export const route = {
  login: getPageUrl({ pageType: "Login" }),
  siteMap: getPageUrl({ pageType: "SiteMap" }),
  discussions: getPageUrl({ pageType: "Discussion" }),
  users: getPageUrl({ pageType: "User" }),
  images: getPageUrl({ pageType: "Image" }),
}