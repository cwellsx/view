import * as DB from "./database";
import * as R from "../shared/request";
import * as Session from "./session";
import { UserSummary } from "../data";

export function mockServer(url: string, userIdLogin: number): object | undefined {
  const parsed = R.getResource(url);
  if (R.isParserError(parsed)) {
    // should return 400 Bad Request
    return undefined;
  }
  const resource: R.Resource = parsed;
  console.log(`mockServer getting ${R.getResourceUrl(resource)}`);

  if (resource.resourceType === "SiteMap") {
    return DB.getSiteMap();
  }

  if (resource.resourceType === "Login") {
    return loginUser();
  }

  if (resource.resourceType === "Image") {
    const requested = R.getImageOptions(resource);
    if (R.isParserError(requested)) {
      // should return 400 Bad Request
      return undefined;
    }
    const { image } = requested;
    return DB.getImage(image.id);
  }

  if (resource.resourceType === "User") {
    if (!resource.what) {
      return DB.getUserSummaries();
    } else {
      const requested = R.getUserOptions(resource);
      if (R.isParserError(requested)) {
        // should return 404 Not Found
        return undefined;
      }
      const { user, userTabType } = requested;
      switch (userTabType) {
        case "Profile":
        case "EditSettings":
          return DB.getUser(user.id, userIdLogin);
        case "Activity":
          // the UserActivityOptions also carries DiscussionsOptions
          const options = R.getUserActivityOptions(resource);
          if (R.isParserError(options)) {
            // should return 400 Bad Request
            return undefined;
          }
          return DB.getUserActivity(options);
        default:
          // should return 500 Internal Server Error
          return undefined;
      }
    }
  }

  if (resource.resourceType === "Discussion") {
    if (!resource.what) {
      const options = R.getDiscussionsOptions(resource);
      if (R.isParserError(options)) {
        // should return 400 Bad Request
        return undefined;
      }
      Session.getSetDiscussionsOptions(userIdLogin, options);
      return DB.getDiscussions(options);
    } else {
      const options = R.getDiscussionOptions(resource);
      if (R.isParserError(options)) {
        // should return 400 Bad Request
        return undefined;
      }
      Session.getSetDiscussionOptions(userIdLogin, options);
      const discussion = DB.getDiscussion(options);
      if (!discussion) {
        // should return 404 Not Found
        return undefined;
      }
      return discussion;
    }
  }

  return undefined;
}

// this is a mock function to be improved
export function loginUser(): UserSummary {
  return DB.getUser(1, 1)!.summary
}
