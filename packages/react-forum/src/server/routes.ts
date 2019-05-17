import * as DB from "./database";
import { PageId, getPageUrl, getPageIdNumber } from "../io/pageId";
import { UserSummary } from "../data";

export function mockServer(pageId: PageId, userIdLogin?: number): object | undefined {
  console.log(`mockServer getting ${getPageUrl(pageId)}`);
  if (pageId.pageType === "SiteMap") {
    return DB.getSiteMap();
  }
  if (pageId.pageType === "Login") {
    return loginUser();
  }
  if (pageId.pageType === "Image") {
    const requested = getPageIdNumber(pageId);
    if (!requested) {
      // should return 400 Bad Request
      return undefined;
    }
    return DB.getImage(requested);
  }
  if (pageId.pageType === "User") {
    if (!pageId.what) {
      return DB.getUserSummaries();
    } else {
      const requested = getPageIdNumber(pageId);
      if (!requested) {
        // should return 404 Not Found
        return undefined;
      } else {
        return DB.getUser(requested, userIdLogin);
      }
    }
  }
  if (pageId.pageType === "Discussion") {
    if (!pageId.what) {
      return DB.getDiscussions();
    }
  }
  return undefined;
}

// this is a mock function to be improved
export function loginUser(): UserSummary {
  return DB.getUser(1, 1)!.summary
}
