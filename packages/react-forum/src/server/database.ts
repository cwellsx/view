import * as I from "../data";
import { BareTag, BareTagCount, BareUser, BareDiscussion, BareMessage, TagId, BareDiscussionMeta } from "./bare";
import { loadImages, loadActions, KeyFromTagId } from "./loader";
import { WireSummaries, WireDiscussions, WireDiscussion, WireUserActivity } from "../shared/wire";
import { getExerpt } from "../shared/exerpt";
import * as R from "../shared/request";
import { CurrentIds } from "./currentIds";
import * as Action from "./actions";
import { TagIdCounts, TagIdDiscussions, simulateTitle } from "./tagIds";
import {configServer} from "../configServer";


/*
  This is an in-RAM database
  or its API wraps an external database.
*/

/*
  Data -- not exported
*/

const allImages: I.Image[] = loadImages();

const allUsers: Map<number, BareUser> = new Map<number, BareUser>();

const allTags: BareTag[] = [];

const allDiscussions: Map<number, BareDiscussion> = new Map<number, BareDiscussion>();

// [discussionId, time]
const sortedDiscussionsNewest: [number, number][] = [];
// [discussionId, time] 
const sortedDiscussionsActive: [number, number][] = [];

// map userId to sorted array of messages
const userMessages: Map<number, BareMessage[]> = new Map<number, BareMessage[]>();
// map messageId to discussionId 
const messageDiscussions: Map<number, number> = new Map<number, number>();
const userTags: Map<number, TagIdCounts> = new Map<number, TagIdCounts>();
// map key to array of discussionId
//const tagDiscussions: Map<string, number[]> = new Map<string, number[]>();
const tagDiscussions: TagIdDiscussions = new TagIdDiscussions(allImages, allTags);
const currentIds: CurrentIds = new CurrentIds();

const getKeyFromTagId: KeyFromTagId = (tagId: TagId) => tagDiscussions.getKey(tagId);

export function messageIdNext(): number {
  return currentIds.messageId.next();
}
export function discussionIdNext(): number {
  return currentIds.discussionId.next();
}

/*
  helper functions
*/

function getMessageTime(message: BareMessage): number {
  return new Date(message.dateTime).getTime();
}

function getUserSummaryFrom(userId: number, data: BareUser): I.UserSummary {
  return {
    idName: { id: userId, name: data.name },
    gravatarHash: data.gravatarHash,
    location: data.profile.location
  }
}

function getUserSummary(userId: number): I.UserSummary {
  return getUserSummaryFrom(userId, allUsers.get(userId)!);
}

function getMessageStarted(discussion: BareDiscussion): BareMessage {
  return discussion.first;
}

function getMessageEnded(discussion: BareDiscussion): BareMessage {
  return (discussion.messages.length) ? discussion.messages[discussion.messages.length - 1] : discussion.first;
}

type GetMessage = (x: BareDiscussion) => BareMessage;

function getDiscussionTime(discussion: BareDiscussion, getMessage: GetMessage): [number, number] {
  return [discussion.meta.idName.id, getMessageTime(getMessage(discussion))];
}

function wireSummaries(discussionMessages: [BareDiscussion, BareMessage][]): WireSummaries {
  const rc: WireSummaries = {
    users: [],
    discussions: []
  }
  const userIds: Set<number> = new Set<number>();
  discussionMessages.forEach(discussionMessage => {
    const [discussion, message] = discussionMessage;
    userIds.add(message.userId);
    rc.discussions.push({
      idName: discussion.meta.idName,
      tags: discussion.meta.tags.map(getKeyFromTagId),
      userId: message.userId,
      messageExerpt: getExerpt(message.markdown),
      dateTime: message.dateTime,
      nAnswers: discussion.messages.length
    });
  });
  userIds.forEach(userId => rc.users.push(getUserSummary(userId)));
  return rc;
}

function wireDiscussion(discussion: BareDiscussion, messages: BareMessage[], range: I.DiscussionRange): WireDiscussion {
  const rc: WireDiscussion = {
    users: [],
    idName: discussion.meta.idName,
    tags: discussion.meta.tags.map(getKeyFromTagId),
    first: discussion.first,
    range,
    messages
  }
  const userIds: Set<number> = new Set<number>();
  userIds.add(discussion.first.userId);
  messages.forEach(message => userIds.add(message.userId));
  userIds.add(rc.first.userId);
  userIds.forEach(userId => rc.users.push(getUserSummary(userId)));
  return rc;
}

function getRange<TSort, TElement>(
  nTotal: number,
  sort: TSort,
  pageSize: number,
  pageNumber: number,
  array: TElement[]): {
    range: { nTotal: number, sort: TSort, pageSize: number, pageNumber: number },
    selected: TElement[]
  } {
  const length = pageSize;
  const start = ((pageNumber - 1) * pageSize);
  const selected = array.slice(start, start + length);
  return { range: { nTotal, sort, pageSize, pageNumber }, selected };
}

/*
  GET functions
*/

export function getSiteMap(): I.SiteMap {
  return {
    images: allImages,
    tags: tagDiscussions.siteTagCounts()
  };
}

export function getImage(id: number): I.Image | undefined {
  return allImages.find(image => image.id === id);
}

export function getUserSummaries(): I.UserSummary[] {
  const rc: I.UserSummary[] = [];
  allUsers.forEach((data, userId) => rc.push(getUserSummaryFrom(userId, data)));
  return rc.sort((x, y) => x.idName.name.localeCompare(y.idName.name));
}

export function getUser(userId: number, userIdLogin?: number): I.User | undefined {
  const data: BareUser | undefined = allUsers.get(userId);
  if (!data) {
    return undefined;
  }
  const preferences: I.UserPreferences | undefined = (userId !== userIdLogin) ? undefined : {
    email: data.email
  };
  return {
    summary: getUserSummaryFrom(userId, data),
    profile: data.profile,
    preferences: preferences
  };
}

export function getUserActivity(options: R.UserActivityOptions): WireUserActivity | undefined {
  // same kind of processing as some combination of getDiscussions and getDiscussion
  // like getDiscussion, we don't have two pre-sorted arrays to choose from, so may have to select from a reversed copy
  const userId = options.user.id;
  const messages: BareMessage[] = userMessages.get(userId)!;
  const sort: R.ActivitySort = options.sort ? options.sort : "Oldest"
  const sortedMessages = (sort === "Oldest") ? messages : messages.slice().reverse();
  // like getDiscussions
  const { range, selected } = getRange(
    messages.length,
    sort,
    30,
    options.page ? options.page : 1,
    sortedMessages
  );
  const discussionMessages: [BareDiscussion, BareMessage][] = selected.map(message => {
    const discussionId: number = messageDiscussions.get(message.messageId)!;
    const discussion: BareDiscussion = allDiscussions.get(discussionId)!;
    return [discussion, message];
  });
  const { users, discussions } = wireSummaries(discussionMessages);
  const tagCounts: BareTagCount[] = userTags.get(userId)!.read();
  // FIXME
  // const tagCounts: I.TagCount[] = bareTagCounts
  return { users, discussions, range, tagCounts };
}

export function getDiscussions(options: R.DiscussionsOptions): WireDiscussions {
  const sort: R.DiscussionsSort = options.sort ? options.sort : "Active"
  const active = sort === "Active";
  // two collections of pre-sorted discussions (using different sort-orders) to choose from
  const sortedDiscussions: [number, number][] = (active) ? sortedDiscussionsActive : sortedDiscussionsNewest;
  const getMessage: GetMessage = (active) ? getMessageEnded : getMessageStarted;
  const { range, selected } = getRange(
    allDiscussions.size,
    sort,
    options.pagesize ? options.pagesize : 50,
    options.page ? options.page : 1,
    sortedDiscussions
  );
  const selectedDiscussions: BareDiscussion[] = selected.map((pair) => allDiscussions.get(pair[0])!);
  const discussionMessages: [BareDiscussion, BareMessage][] = selectedDiscussions.map(
    discussion => [discussion, getMessage(discussion)]);
  const { users, discussions } = wireSummaries(discussionMessages);
  return { users, discussions, range };
}

export function getDiscussion(options: R.DiscussionOptions): WireDiscussion | undefined {
  const discussion = allDiscussions.get(options.discussion.id);
  if (!discussion) {
    return undefined;
  }
  const sort: R.DiscussionSort = options.sort ? options.sort : "Oldest"
  const sortedMessages = (sort === "Oldest") ? discussion.messages : discussion.messages.slice().reverse();
  const { range, selected } = getRange(
    discussion.messages.length,
    sort,
    30,
    options.page ? options.page : 1,
    sortedMessages
  );
  return wireDiscussion(discussion, selected, range);
}

export function getAllTags(): I.TagCount[] {
  return tagDiscussions.tagCounts();
}

/*
  POST functions
*/

function postNewUser(action: Action.NewUser): I.IdName {
  const { userId, user } = Action.extractNewUser(action);
  allUsers.set(userId, user);
  userMessages.set(userId, []);
  userTags.set(userId, new TagIdCounts(allImages));
  return { id: userId, name: user.name };
}

function postNewUserProfile(action: Action.NewUserProfile): I.IdName {
  const { userId, posted } = Action.extractNewUserProfile(action);
  const user = allUsers.get(userId)!;
  if (posted.name) {
    user.name = posted.name;
  }
  if (posted.email) {
    user.email = posted.email;
  }
  if (posted.profile) {
    const { location, aboutMe } = posted.profile;
    if (location) {
      user.profile.location = location;
    }
    if (aboutMe) {
      user.profile.aboutMe = aboutMe;
    }
  }
  return { id: userId, name: user.name };
}

function postNewTopic(action: Action.NewTopic): I.Key {
  const tag: BareTag = Action.extractNewTopic(action);
  if (!tagDiscussions.addTag(tag.key)) {

    // FIXME

  }
  allTags.push(tag);
  return { key: tag.key };
}

function postNewDiscussion(action: Action.NewDiscussion): I.IdName {
  const { idName, tags, first: message } = Action.extractNewDiscussion(action);
  const discussionId = idName.id;
  // ensure that the tags exist and/or can be created
  const tagIds: TagId[]=[];
  for (const tag of tags) {
    let tagId = tagDiscussions.find(tag);
    if (!tagId) {
      if (!configServer.autoAddTag) {

        // FIXME

        continue;
      }
      // auto-create it now
      const title = simulateTitle(tag);
      const newTopic: Action.NewTopic = Action.createNewTopic({title},action.dateTime,action.userId);
      handleAction(newTopic);
      // try again to find it
      tagId = tagDiscussions.find(tag);
      if (!tagId) {

        // FIXME

        continue;
      }
    }
    tagIds.push(tagId);
  }
  // the discussion is associated with tags
  tagIds.forEach(tagId => tagDiscussions.addDiscussionId(tagId, discussionId));
  // construct BareDiscussionMeta using TagId[]
  const meta: BareDiscussionMeta = {idName, tags: tagIds};
  // new discussion
  const discussion: BareDiscussion = { meta, first: message, messages: [] };
  allDiscussions.set(discussionId, discussion);
  const active = getDiscussionTime(discussion, getMessageStarted);
  sortedDiscussionsNewest.unshift(active);
  sortedDiscussionsActive.unshift(active);
  // the user owns this message
  userMessages.get(message.userId)!.push(message);
  // the message is associated with this discussion
  messageDiscussions.set(message.messageId, discussionId);
  return meta.idName;
}

function postNewMessage(action: Action.NewMessage): I.Message {
  const { discussionId, message } = Action.extractNewMessage(action);
  const discussion: BareDiscussion = allDiscussions.get(discussionId)!;
  // add to the discussion
  discussion.messages.push(message);
  // this discussion is now the most active
  function activate(active: [number, number]) {
    // search backwards because it's likely to be more towards the end
    for (let i = sortedDiscussionsActive.length - 1; i >= 0; --i) {
      if (sortedDiscussionsActive[i][0] === active[0]) {
        sortedDiscussionsActive.splice(i, 1);
        sortedDiscussionsActive.unshift(active);
        return;
      }
    }
    console.log("error active discussion not found");
  }
  activate(getDiscussionTime(discussion, getMessageEnded));
  // the user owns this message
  userMessages.get(message.userId)!.push(message);
  // the message is associated with this discussion
  messageDiscussions.set(message.messageId, discussionId);
  return { userSummary: getUserSummary(message.userId), markdown: message.markdown, dateTime: message.dateTime };
}

export function handleAction(action: Action.Any) {
  switch (action.type) {
    case "NewUser":
      return postNewUser(action);
    case "NewUserProfile":
      return postNewUserProfile(action);
    case "NewTopic":
      return postNewTopic(action);
    case "NewDiscussion":
      return postNewDiscussion(action);
    case "NewMessage":
      return postNewMessage(action);
    default:
      return { error: "Unexpected post type" };
  }
}

/*
  Loader
*/

function onLoad(): void {
  // images are pre-loaded separately; add the corresponding tagIds
  const actions: Action.Any[] = loadActions(getKeyFromTagId);
  function assertId(what: string, actual: number, expected: number, action: Action.Any) {
    if (actual !== expected) {
      const first: string = JSON.stringify({ actual, expected }, null, 2);
      const second: string = JSON.stringify(action, null, 2);
      console.error(`onLoad assert ${what}Id ${first} ${second}`);
    }
  }
  actions.forEach(action => {
    // assert that the embedded IDs are in the expected sequence
    switch (action.type) {
      case "NewUser":
        assertId("user", action.userId, currentIds.userId.next(), action);
        break;
      case "NewDiscussion":
        assertId("discussion", action.discussionId, currentIds.discussionId.next(), action);
        assertId("message", action.messageId, currentIds.messageId.next(), action);
        break;
      case "NewMessage":
        assertId("message", action.messageId, currentIds.messageId.next(), action);
        break;
      default:
        break;
    }
    // delegate to the action handler (to replay what happened when the action originally occured)
    handleAction(action);
  });
}
onLoad();
