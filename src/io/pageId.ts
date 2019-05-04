import { IdName } from "../data/Id";

export type PageType = "SiteMap" | "Login" | "Discussion" | "User";

export interface PageId {
  pageType: PageType
  ids?: IdName[]
}

const pageTypeUrls: Array<[PageType, string]> = [
  ["SiteMap", "sitemap"],
  ["Login", "login"],
  ["Discussion", "discussions"],
  ["User", "users"]
];

export function getPageUrl(pageId: PageId): string {
  const found = pageTypeUrls.find((pair) => pair[0] === pageId.pageType);
  if (!found) {
    throw new Error(`Undefined PageType: '${pageId.pageType}'`);
  }
  let url = `/${found[1]}`;
  if (pageId.ids) {
    pageId.ids.forEach((pair) => url += `/${pair.id}/${pair.name}`);
  }
  return url;
}

export const route = {
  login: getPageUrl({ pageType: "Login" }),
  siteMap: getPageUrl({ pageType: "SiteMap" }),
  discussions: getPageUrl({ pageType: "Discussion" }),
  users: getPageUrl({ pageType: "User" }),
}