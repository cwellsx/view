import * as DB from "./database";
import * as R from "../shared/request";
import * as Session from "./session";
import { Key, UserSummary } from "../data";
import * as Post from "../shared/post";
import * as Posted from "./posted";
import { BareDiscussionMeta, BareMessage } from "./bare";

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

    default:
      return undefined;
  }
}

// this is a mock function to be improved
export function loginUser(): UserSummary {
  return DB.getUser(1, 1)!.summary
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
  console.log(`server routeOnPost ${R.postResourceUrl(resource)}`);

  const dateTime: string = (new Date()).toUTCString();

  // convert from resource: Resource plus json: any to Posted.Any
  function getPosted(resource: R.Resource): Posted.Any | R.ParserError {
    switch (resource.resourceType) {
      case "Discussion": {
        if (resource.post === "answer/submit") {
          const requested = R.getResourceId(resource);
          if (!requested) {
            // should return 400 Bad Request
            return { error: "Expected a numeric ID" };
          }
          const discussionId = requested.id;
          const data = json as Post.NewMessage;
          const messageId = DB.messageIdNext();
          const message: BareMessage = { messageId, userId, markdown: data.markdown, dateTime };
          return { kind: "NewMessage", discussionId, message };
        }
        if (resource.word === "new") {
          const data = json as Post.NewDiscussion;
          const discussionId = DB.discussionIdNext();
          const tags: Key[] = data.tags.map(key => { return { key }; });
          const meta: BareDiscussionMeta = { idName: { id: discussionId, name: data.title }, tags };
          const messageId = DB.messageIdNext();
          const message: BareMessage = { messageId, userId, markdown: data.markdown, dateTime };
          return { kind: "NewDiscussion", meta, first: message };
        }
        return { error: "Unexpected Discussion post" };
      }
      default:
        return { error: "Unexpected resource type" };
    }
  }

  const posted = getPosted(resource);
  if (R.isParserError(posted)) {
    // should return 400 Bad Request
    console.log(posted.error);
    return undefined;
  }

  switch (posted.kind) {
    case "NewMessage":
      return DB.postNewMessage(posted);
    case "NewDiscussion":
      return DB.postNewDiscussion(posted);
    default:
      return { error: "Unexpected post type" };
  }
}
