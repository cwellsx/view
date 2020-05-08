import * as DB from "./database";
import * as Session from "./session";
import { UserSummary, Url, Post, SearchInput } from "shared-lib";
import * as Action from "./actions";

/*
  This unwraps and dispatches data received from the client.

  It should do this more carefully than it does currently,
  using typeguards which assert the existence of every element of the received data,
  and/or it should be wrapped in try/catch handlers,
  e.g. in case malformed data is received from a corrupt client.
*/

// you could temporarily change this to enable logging, for debugging
const isLogging = true;

export function routeOnGet(url: string, userIdLogin: number): object | undefined {
  if (isLogging) {
    console.log(`server routeOnGet ${url}`);
  }
  // parse the URL
  const location: Url.Location = Url.getLocation(url);
  const resourceType = Url.getResourceType(location);
  if (Url.isParserError(resourceType)) {
    // should return 400 Bad Request
    return undefined;
  }

  switch (resourceType) {
    case "SiteMap":
      return DB.getSiteMap();

    // case "Login":
    //   return DB.getSiteMap();

    case "Image": {
      const image = Url.isImage(location);
      if (Url.isParserError(image)) {
        // should return 400 Bad Request
        return undefined;
      }
      return DB.getImage(image.id);
    }

    case "User": {
      if (Url.isUsers(location)) {
        return DB.getUserSummaries();
      }

      const userOptions = Url.isUserOptions(location);
      if (Url.isParserError(userOptions)) {
        // should return 404 Not Found
        return undefined;
      }
      const { user, userTabType } = userOptions;
      switch (userTabType) {
        case "Profile":
        case "EditSettings":
        case undefined:
          return DB.getUser(user.id, userIdLogin);
        case "Activity":
          // the UserActivityOptions also carries DiscussionsOptions
          const userActivity = Url.isUserActivityOptions(location);
          if (Url.isParserError(userActivity)) {
            // should return 400 Bad Request
            return undefined;
          }
          return DB.getUserActivity(userActivity);
        default:
          // should return 500 Internal Server Error
          return undefined;
      }
    }

    case "Discussion": {
      {
        const options = Url.isDiscussionsOptions(location);
        if (!Url.isParserError(options)) {
          Session.getSetDiscussionsOptions(userIdLogin, options);
          return DB.getDiscussions(options);
        }
        // else maybe a specific discussion
      }

      {
        const options = Url.isDiscussionOptions(location);
        if (!Url.isParserError(options)) {
          Session.getSetDiscussionOptions(userIdLogin, options);
          const discussion = DB.getDiscussion(options);
          if (!discussion) {
            // should return 404 Not Found
            return undefined;
          }
          return discussion;
        }
      }

      // should return 400 Bad Request
      return undefined;
    }

    case "Tag": {
      if (Url.isAllTags(location)) {
        return DB.getAllTags();
      }
      const options = Url.isTagsOptions(location);
      if (!Url.isParserError(options)) {
        return DB.getTags(options);
      }
      const key = Url.isTagKey(location);
      if (!Url.isParserError(key)) {
        return DB.getTag(key);
      }
      // should return 400 Bad Request
      return undefined;
    }

    default:
      return undefined;
  }
}

// this is a mock function to be improved
export function loginUser(): UserSummary {
  const { id, name, gravatarHash, location } = DB.getUser(1, 1)!;
  return { id, name, gravatarHash, location };
}

export function routeOnPost(url: string, userId: number, json: any): object | undefined {
  if (isLogging) {
    console.log(`server routeOnPost ${url} -- ${JSON.stringify(json, undefined, 2)}`);
  }
  // parse the URL
  const location: Url.Location = Url.getLocation(url);
  const resourceType = Url.getResourceType(location);
  if (Url.isParserError(resourceType)) {
    // should return 400 Bad Request
    return undefined;
  }

  const dateTime: string = new Date().toUTCString();

  // convert from resource: Resource plus json: any to Action.Any
  function getAction(resourceType: Url.ResourceType): Action.Any | Url.ParserError {
    switch (resourceType) {
      case "Discussion": {
        // new answer
        {
          // get the discussionId from the URL
          const discussionId = Url.isNewAnswer(location);
          if (discussionId) {
            // and other input data
            const posted = json as Post.NewMessage;
            const messageId = DB.messageIdNext();
            // construct the action
            return Action.createNewMessage(posted, dateTime, userId, discussionId, messageId);
          }
        }

        // new discussion
        if (Url.isNewDiscussion(location)) {
          const posted = json as Post.NewDiscussion;
          const discussionId = DB.discussionIdNext();
          const messageId = DB.messageIdNext();
          return Action.createNewDiscussion(posted, dateTime, userId, discussionId, messageId);
        }

        return { error: "Unexpected Discussion post" };
      }

      case "User": {
        // edit settings
        {
          // get the userId from the URL
          const urlUserId = Url.isEditUserProfile(location);
          if (urlUserId) {
            if (userId !== urlUserId) {
              // should return 403 Forbidden
              return { error: "Expected user to edit their own settings only" };
            }
            const posted = json as Post.EditUserProfile;
            return Action.createEditUserProfile(posted, dateTime, userId);
          }
        }

        return { error: "Unexpected User post" };
      }

      case "Tag": {
        const tag = Url.isEditTagInfo(location);
        if (tag) {
          const posted = json as Post.EditTagInfo;
          return Action.createEditTagInfo(posted, dateTime, userId, tag);
        }
        return { error: "Unexpected Tag post" };
      }

      default:
        return { error: "Unexpected resource type" };
    }
  }

  // handle things which are implemented as a POST because they include JSON body data
  // but which aren't a type of action which updates the database data
  switch (resourceType) {
    case "Login":
      return loginUser();
    case "Tag":
      const options = Url.isTagsOptions(location);
      if (!Url.isParserError(options)) {
        return DB.getTags(options, (json as SearchInput).searchInput);
      }
      break;
    default:
      break;
  }

  const action = getAction(resourceType);
  if (Url.isParserError(action)) {
    // should return 400 Bad Request
    console.log(action.error);
    return undefined;
  }

  return DB.handleAction(action);
}
