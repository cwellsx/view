import * as DB from "./database";
import * as P from "../shared/request";
import * as Session from "./session";
import { UserSummary } from "../data";

export function mockServer(resource: P.Resource, userIdLogin: number): object | undefined {
  console.log(`mockServer getting ${P.getResourceUrl(resource)}`);
  if (resource.resourceType === "SiteMap") {
    return DB.getSiteMap();
  }
  if (resource.resourceType === "Login") {
    return loginUser();
  }
  if (resource.resourceType === "Image") {
    const requested = P.getResourceId(resource);
    if (!requested) {
      // should return 400 Bad Request
      return undefined;
    }
    return DB.getImage(requested);
  }
  if (resource.resourceType === "User") {
    if (!resource.what) {
      return DB.getUserSummaries();
    } else {
      const requested = P.getResourceId(resource);
      if (!requested) {
        // should return 404 Not Found
        return undefined;
      } else {
        return DB.getUser(requested, userIdLogin);
      }
    }
  }
  if (resource.resourceType === "Discussion") {
    if (!resource.what) {
      const options = P.getDiscussionsOptions(resource);
      if (P.isParserError(options)) {
        // should return 400 Bad Request
        return undefined;
      }
      Session.getSetDiscussionsOptions(userIdLogin, options);
      return DB.getDiscussions(options);
    }
  }
  return undefined;
}

// this is a mock function to be improved
export function loginUser(): UserSummary {
  return DB.getUser(1, 1)!.summary
}
