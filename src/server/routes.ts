import * as DB from "./database";
import * as P from "../io/pageId";
import * as Session from "./session";
import { UserSummary } from "../data";

export function mockServer(pageId: P.PageId, userIdLogin: number): object | undefined {
  console.log(`mockServer getting ${P.getPageUrl(pageId)}`);
  if (pageId.pageType === "SiteMap") {
    return DB.getSiteMap();
  }
  if (pageId.pageType === "Login") {
    return loginUser();
  }
  if (pageId.pageType === "Image") {
    const requested = P.getPageIdNumber(pageId);
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
      const requested = P.getPageIdNumber(pageId);
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
      const options = P.getDiscussionsPageOptions(pageId);
      if (P.isPageIdError(options)) {
        // should return 400 Bad Request
        return undefined;
      }
      Session.getSetDiscussionsPageOptions(userIdLogin, options);
      return DB.getDiscussions(options);
    }
  }
  return undefined;
}

// this is a mock function to be improved
export function loginUser(): UserSummary {
  return DB.getUser(1, 1)!.summary
}
