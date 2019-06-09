import * as DB from "./database";
import * as R from "../shared/request";
import * as Session from "./session";
import { UserSummary } from "../data";
import * as Post from "../shared/post";
import * as Action from "./actions";

/*
  This unwraps and dispatches data received from the client.

  It should do this more carefully than it does currently,
  using typeguards which assert the existence of every element of the received data,
  and/or it should be wrapped in try/catch handlers,
  e.g. in case malformed data is received from a corrupt client.
*/

export function routeOnGet(url: string, userIdLogin: number): object | undefined {
  // parse the URL
  const parsed = R.getResource(url, false);
  if (R.isParserError(parsed)) {
    // should return 400 Bad Request
    return undefined;
  }
  const resource: R.Resource = parsed;
  console.log(`server routeOnGet ${R.getResourceUrl(resource)}`);

  switch (resource.resourceType) {
    case "SiteMap":
      return DB.getSiteMap();

    case "Login":
      return DB.getSiteMap();

    case "Image": {
      const requested = R.getImageOptions(resource);
      if (R.isParserError(requested)) {
        // should return 400 Bad Request
        return undefined;
      }
      const { image } = requested;
      return DB.getImage(image.id);
    }

    case "User": {
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

    case "Discussion": {
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

    case "Tag": {
      return DB.getAllTags();
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
  // parse the URL
  const parsed = R.getResource(url, true);
  if (R.isParserError(parsed)) {
    // should return 400 Bad Request
    console.log(parsed.error);
    return undefined;
  }
  const resource: R.Resource = parsed;
  console.log(`server routeOnPost ${R.postResourceUrl(resource)} ${JSON.stringify(json, undefined, 2)}`);

  const dateTime: string = (new Date()).toUTCString();

  // convert from resource: Resource plus json: any to Action.Any
  function getAction(resource: R.Resource): Action.Any | R.ParserError {
    switch (resource.resourceType) {
      case "Discussion": {

        // new answer
        if (resource.post === "answer/submit") {
          // get the discussionId from the URL
          const requested = R.getResourceId(resource);
          if (!requested) {
            // should return 400 Bad Request
            return { error: "Expected a numeric ID" };
          }
          const discussionId = requested.id;
          // and other input data
          const posted = json as Post.NewMessage;
          const messageId = DB.messageIdNext();
          // construct the action
          return Action.createNewMessage(posted, dateTime, userId, discussionId, messageId);
        }

        // new discussion
        if (resource.word === "new") {
          const posted = json as Post.NewDiscussion;
          const discussionId = DB.discussionIdNext();
          const messageId = DB.messageIdNext();
          return Action.createNewDiscussion(posted, dateTime, userId, discussionId, messageId);
        }

        return { error: "Unexpected Discussion post" };
      }

      case "User": {
        // edit settings
        if (resource.word === "edit") {
          // get the userId from the URL
          const requested = R.getResourceId(resource);
          if (!requested) {
            // should return 400 Bad Request
            return { error: "Expected a numeric ID" };
          }
          if (userId !==requested.id) {
            // should return 403 Forbidden
            return { error: "Expected user to edit their own settings only" };
          }
          const posted = json as Post.EditUserProfile;
          return Action.createEditUserProfile(posted, dateTime, userId);
        }
        
        return { error: "Unexpected User post" };
      }

      default:
        return { error: "Unexpected resource type" };
    }
  }

  if (resource.resourceType==="Login") {
    return loginUser();
  }

  const action = getAction(resource);
  if (R.isParserError(action)) {
    // should return 400 Bad Request
    console.log(action.error);
    return undefined;
  }

  return DB.handleAction(action);
}
