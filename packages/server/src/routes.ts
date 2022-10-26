import { Cache, Cached, CachedT, Message, Post, SearchInput, Url, UserSummary } from 'shared-lib';

import * as Action from './actions';
import * as DB from './database';
import { HttpStatus } from './httpStatus';
import * as Session from './session';

/*
  This unwraps and dispatches data received from the client.

  It should do this more carefully than it does currently,
  using typeguards which assert the existence of every element of the received data,
  and/or it should be wrapped in try/catch handlers,
  e.g. in case malformed data is received from a corrupt client.
*/

// you could temporarily change this to enable logging, for debugging
const isLogging = true;

type Fetched = [Cache, object];

/*
  If this fails then it returns HttpStatus
  If it succeeds then it returns the data, plus the same data wrapped in a Cache instance for server-side rendering
*/

export function routeOnGet(url: string, userIdLogin: number): Fetched | HttpStatus {
  if (isLogging) {
    console.log(`server routeOnGet ${url}`);
  }
  // parse the URL
  const location: Url.Location = Url.getLocation(url);
  const resourceType = Url.getResourceType(location);
  if (Url.isParserError(resourceType)) {
    // should return 400 Bad Request
    return { httpStatus: 400 };
  }

  switch (resourceType) {
    case "SiteMap":
      const siteMap = DB.getSiteMap();
      return [{ getSiteMap: new Cached(siteMap) }, siteMap];

    // case "Login":
    //   return DB.getSiteMap();

    case "Image": {
      const idName = Url.isImage(location);
      if (Url.isParserError(idName)) {
        // should return 400 Bad Request
        return { httpStatus: 400 };
      }
      const image = DB.getImage(idName.id);
      return image ? [{ getImage: new CachedT(idName, image) }, image] : { httpStatus: 404 };
    }

    case "User": {
      if (Url.isUsers(location)) {
        const users = DB.getUserSummaries();
        return [{ getUsers: new Cached(users) }, users];
      }

      const userOptions = Url.isUserOptions(location);
      if (Url.isParserError(userOptions)) {
        // should return 404 Not Found
        return { httpStatus: 404 };
      }
      const { user: idName, userTabType } = userOptions;
      switch (userTabType) {
        case "Profile":
        case "EditSettings":
        case undefined:
          const user = DB.getUser(idName.id, userIdLogin);
          return user ? [{ getUser: new CachedT(idName, user) }, user] : { httpStatus: 404 };
        case "Activity":
          // the UserActivityOptions also carries DiscussionsOptions
          const options = Url.isUserActivityOptions(location);
          if (Url.isParserError(options)) {
            // should return 400 Bad Request
            return { httpStatus: 400 };
          }
          const userActivity = DB.getUserActivity(options);
          return userActivity
            ? [{ getUserActivity: new CachedT(options, Message.unwireUserActivity(userActivity)) }, userActivity]
            : { httpStatus: 404 };
        default:
          // should return 500 Internal Server Error
          return { httpStatus: 500 };
      }
    }

    case "Discussion": {
      {
        const options = Url.isDiscussionsOptions(location);
        if (!Url.isParserError(options)) {
          Session.getSetDiscussionsOptions(userIdLogin, options);
          const discussions = DB.getDiscussions(options);
          return [{ getDiscussions: new CachedT(options, Message.unwireDiscussions(discussions)) }, discussions];
        }
        // else maybe a specific discussion
      }

      {
        const options = Url.isDiscussionOptions(location);
        if (!Url.isParserError(options)) {
          Session.getSetDiscussionOptions(userIdLogin, options);
          const discussion = DB.getDiscussion(options);
          return discussion
            ? [{ getDiscussion: new CachedT(options, Message.unwireDiscussion(discussion)) }, discussion]
            : // should return 404 Not Found
              { httpStatus: 404 };
        }
      }

      // should return 400 Bad Request
      return { httpStatus: 400 };
    }

    case "Tag": {
      if (Url.isAllTags(location)) {
        const tags = DB.getAllTags();
        return [{ getAllTags: new Cached(tags) }, tags];
      }
      const options = Url.isTagsOptions(location);
      if (!Url.isParserError(options)) {
        const tags = DB.getTags(options);
        return [{ getTags: new CachedT(options, tags) }, tags];
      }
      const key = Url.isTagKey(location);
      if (!Url.isParserError(key)) {
        const tag = DB.getTag(key);
        return tag ? [{ getTag: new CachedT(key, tag) }, tag] : { httpStatus: 404 };
      }
      // should return 400 Bad Request
      return { httpStatus: 400 };
    }

    default:
      return { httpStatus: 400 };
  }
}

// this is a mock function to be improved
export function loginUser(): UserSummary {
  const { id, name, gravatarHash, location } = DB.getUser(1, 1)!;
  return { id, name, gravatarHash, location };
}

export function routeOnPost(url: string, userId: number, json: any): object | HttpStatus {
  if (isLogging) {
    console.log(`server routeOnPost ${url} -- ${JSON.stringify(json, undefined, 2)}`);
  }
  // parse the URL
  const location: Url.Location = Url.getLocation(url);
  const resourceType = Url.getResourceType(location);
  if (Url.isParserError(resourceType)) {
    // should return 400 Bad Request
    return { httpStatus: 400 };
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
    return { httpStatus: 400 };
  }

  return DB.handleAction(action);
}
