import { BareTopic, BareUser, BareDiscussion, BareMessage } from "./bare";
import { TagId } from "./bare";
import { Key } from "../data";
import * as Action from "./actions";
import * as Post from "../shared/post";

/*
  This module loads data from modules in the server_data directory.
  It cannot use the "path" and "fs" (these aren't supported in the browser)
  and must instead use "import" to import modules using string-literal names.
*/

/*
  private helper function to load data from json
*/

type Alternate = (wanted: any, found: any) => boolean;

function assertTypeT<T>(loaded: any, wanted: T, optional?: Set<string>, alternate?: Alternate): T {
  function assertType(found: any, wanted: any, keyNames?: string): void {
    if (typeof wanted !== typeof found) {
      throw new Error(`assertType expected ${typeof wanted} but found ${typeof found}`);
    }
    switch (typeof wanted) {
      case "boolean":
      case "number":
      case "string":
        return; // primitive value type -- done checking
      case "object":
        break; // more to check
      case "undefined":
      case "symbol":
      case "function":
      default:
        throw new Error(`assertType does not support ${typeof wanted}`);
    }
    if (Array.isArray(wanted)) {
      if (!Array.isArray(found)) {
        throw new Error(`assertType expected an array but found ${found}`);
      }
      if (wanted.length === 0) {
        // throw new Error(`assertType can't deduce the expected type from a zero-length array`);
      } else if (wanted.length === 1) {
        // assume we want a homogenous array with all elements the same type
        for (const element of found) {
          assertType(element, wanted[0]);
        }
      } else {
        // assume we want a tuple
        if (found.length !== wanted.length) {
          throw new Error(`assertType expected tuple length ${wanted.length} found ${found.length}`);
        }
        for (let i = 0; i < wanted.length; ++i) {
          assertType(found[i], wanted[i]);
        }
      }
      return;
    }
    if (alternate && alternate(wanted, found)) {
      // matches the alternate version
      return;
    }
    for (const key in wanted) {
      const expected = keyNames ? keyNames + "." + key : key;
      if (typeof found[key] === 'undefined') {
        if (!optional || !optional.has(expected)) {
          throw new Error(`assertType expected ${expected} in ${JSON.stringify(wanted)} is ${JSON.stringify(found)}`);
        }
      } else {
        assertType(found[key], wanted[key], expected);
      }
    }
  }

  assertType(loaded, wanted);
  return loaded as T;
}

/*
  `loadXxx(): Xxx` functions
*/

function loadUsers(): Map<number, BareUser> {
  const found = require("../server_data/users.json");
  const sample: [number, BareUser] = [
    1,
    {
      "name": "ChrisW",
      "email": "cwellsx@gmail.com",
      "gravatarHash": "75bfdecf63c3495489123fe9c0b833e1",
      "dateTime": "Thu, 03 Jan 2019 22:35:05 GMT",
      "profile": {
        "location": "Normandy",
        "aboutMe": "I wrote this!\n\nFurther details are to be supplied ..."
      },
      "favourites": []
    }
  ];
  const optional: Set<string> = new Set<string>(["profile.aboutMe", "profile.location"]);
  const loaded: [number, BareUser][] = assertTypeT(found, [sample], optional);
  return new Map<number, BareUser>(loaded);
}

export { loadImages } from "../server_data/images";

function loadTags(): BareTopic[] {
  const found = require("../server_data/tags.json");
  const sample: BareTopic = {
    title: "foo",
    userId: 0,
    dateTime: "Thu, 03 Jan 2019 22:35:05 GMT"
  };
  const loaded: BareTopic[] = assertTypeT(found, [sample]);
  return loaded;
}

function loadDiscussions(): Map<number, BareDiscussion> {
  const found = require("../server_data/discussions.json");
  const sampleMessage: BareMessage = {
    userId: 7,
    markdown: "Maecenas dignissim et ante sit amet fermentum.",
    dateTime: "Thu, 03 Jan 2019 22:35:05 GMT",
    messageId: 1
  };
  const sample: BareDiscussion = {
    id: 1,
    name: "Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
    tags: [{ tag: "foo" }],
    first: sampleMessage,
    messages: [sampleMessage]
  };
  const alternate: Alternate = (wanted: any, found: any) => {
    if ((wanted.tag) === undefined) {
      // not the wanted we're trying to match
      return false;
    }
    return ((found.id) !== undefined) && (found.resourceType !== undefined);
  }
  const loaded: BareDiscussion[] = assertTypeT(found, [sample], undefined, alternate);
  return new Map<number, BareDiscussion>(loaded.map(x => [x.id, x]));
}

export type KeyFromTagId = (tagId: TagId) => Key;

export function loadActions(getKeyFromTagId: KeyFromTagId): Action.Any[] {
  const rc: Action.Any[] = [];

  const tags: BareTopic[] = loadTags();
  function tagToNewTopic(tag: BareTopic): Action.NewTopic {
    const { title, summary, markdown, userId, dateTime } = tag;
    const posted: Post.NewTopic = { title, summary, markdown };
    return Action.createNewTopic(posted, dateTime, userId);
  }
  rc.push(...tags.map(tagToNewTopic))

  const users: Map<number, BareUser> = loadUsers();
  function userToNewUser(userId: number, user: BareUser): Action.NewUser {
    const { name, email, dateTime } = user;
    const posted: Post.NewUser = { name, email };
    return Action.createNewUser(posted, dateTime, userId);
  }
  function userToNewUserProfile(userId: number, user: BareUser): Action.EditUserProfile {
    const { profile, dateTime } = user;
    const { location, aboutMe } = profile;
    const posted: Post.EditUserProfile = { location, aboutMe };
    return Action.createEditUserProfile(posted, dateTime, userId);
  }
  users.forEach((user: BareUser, userId: number) => {
    rc.push(userToNewUser(userId, user));
    rc.push(userToNewUserProfile(userId, user));
  });

  const discussions: Map<number, BareDiscussion> = loadDiscussions();
  function discussionToNewDiscussion(discussionId: number, discussion: BareDiscussion, first: BareMessage)
    : Action.NewDiscussion {
    const title: string = discussion.name;
    const tags: Key[] = discussion.tags.map(getKeyFromTagId);
    const { markdown, messageId, dateTime, userId } = first;
    const posted: Post.NewDiscussion = { title, tags: tags.map(tag => tag.key), markdown };
    return Action.createNewDiscussion(posted, dateTime, userId, discussionId, messageId);
  }
  function messageToNewMessage(discussionId: number, message: BareMessage): Action.NewMessage {
    const { markdown, messageId, dateTime, userId } = message;
    const posted: Post.NewMessage = { markdown };
    return Action.createNewMessage(posted, dateTime, userId, discussionId, messageId);
  }
  discussions.forEach((discussion: BareDiscussion, discussionId: number) => {
    const { first, messages } = discussion;
    rc.push(discussionToNewDiscussion(discussionId, discussion, first));
    rc.push(...messages.map(message => messageToNewMessage(discussionId, message)));
  });

  const sorted: [Action.Any, number][] = rc.map(action => [action, (new Date(action.dateTime)).getTime()]);
  sorted.sort((x, y) => {
    if (x[1] !== y[1]) {
      return x[1] - y[1];
    }
    return Action.getLoadPriority(x[0]) - Action.getLoadPriority(y[0]);
  })

  return sorted.map(pair => pair[0]);
}