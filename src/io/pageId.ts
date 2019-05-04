import { IdName } from "../data/Id";

export type PageType = "SiteMap" | "Login" | "Discussion" | "User" | "Image";

export interface PageId {
  pageType: PageType
  id?: IdName[] | IdName
}

const pageTypeUrls: Array<[PageType, string]> = [
  ["SiteMap", "sitemap"],
  ["Login", "login"],
  ["Discussion", "discussions"],
  ["User", "users"],
  ["Image", "images"],
];

// from https://github.com/valeriangalliat/markdown-it-anchor/blob/master/index.js
const slugify = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))

export function getPageUrl(pageId: PageId): string {
  const found = pageTypeUrls.find((pair) => pair[0] === pageId.pageType);
  if (!found) {
    throw new Error(`Undefined PageType: '${pageId.pageType}'`);
  }
  let url = `/${found[1]}`;
  function addIdName(idName: IdName) {url += `/${idName.id}/${slugify(idName.name)}`;}
  if (pageId.id) {
    if (Array.isArray(pageId.id)) {
      pageId.id.forEach(addIdName);
    } else {
      addIdName(pageId.id);
    }
  }
  return url;
}

export const route = {
  login: getPageUrl({ pageType: "Login" }),
  siteMap: getPageUrl({ pageType: "SiteMap" }),
  discussions: getPageUrl({ pageType: "Discussion" }),
  users: getPageUrl({ pageType: "User" }),
}