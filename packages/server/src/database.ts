import { BareDiscussion, BareMessage, BareTag, BareTagCount, BareUser, isTag, TagId } from 'server-types';
import { Data, Url, Wire } from 'shared-lib';

import * as Action from './actions';
import { configServer } from './configServer';
import { CurrentIds } from './currentIds';
import { getExerpt } from './exerpt';
import { HttpStatus } from './httpStatus';
import { KeyFromTagId, loadActions, loadImages } from './loader';
import { TagIdCounts, TagIdDiscussions } from './tagIds';

/*
  This is an in-RAM database
  or its API wraps an external database.
*/

/*
  Data -- not exported
*/

const allImages: Data.Image[] = loadImages();

const allUsers: Map<number, BareUser> = new Map<number, BareUser>();

const allTags: BareTag[] = [];

const allDiscussions: Map<number, BareDiscussion> = new Map<number, BareDiscussion>();

// these are both an array of [discussionId, time]
const sortedDiscussionsNewest: [number, number][] = [];
const sortedDiscussionsActive: [number, number][] = [];

// map userId to sorted array of messages
const userMessages: Map<number, BareMessage[]> = new Map<number, BareMessage[]>();
// map messageId to discussionId
const messageDiscussions: Map<number, number> = new Map<number, number>();

const userTags: Map<number, TagIdCounts> = new Map<number, TagIdCounts>();

// map key to array of discussionId
const tagDiscussions: TagIdDiscussions = new TagIdDiscussions(allImages, allTags);

const currentIds: CurrentIds = new CurrentIds();

/*
  helper functions
*/

const getKeyFromTagId: KeyFromTagId = (tagId: TagId) => tagDiscussions.getKey(tagId);

export function messageIdNext(): number {
  return currentIds.messageId.next();
}
export function discussionIdNext(): number {
  return currentIds.discussionId.next();
}

function getMessageTime(message: BareMessage): number {
  return new Date(message.dateTime).getTime();
}

function getUserSummaryFrom(userId: number, data: BareUser): Data.UserSummary {
  return {
    id: userId,
    name: data.name,
    gravatarHash: data.gravatarHash,
    location: data.profile.location,
  };
}

function getUserSummary(userId: number): Data.UserSummary {
  return getUserSummaryFrom(userId, allUsers.get(userId)!);
}

function getMessageStarted(discussion: BareDiscussion): BareMessage {
  return discussion.first;
}

function getMessageEnded(discussion: BareDiscussion): BareMessage {
  return discussion.messages.length ? discussion.messages[discussion.messages.length - 1] : discussion.first;
}

type GetMessage = (x: BareDiscussion) => BareMessage;

function getDiscussionTime(discussion: BareDiscussion, getMessage: GetMessage): [number, number] {
  return [discussion.id, getMessageTime(getMessage(discussion))];
}

function wireSummaries(discussionMessages: [BareDiscussion, BareMessage][]): Wire.WireSummaries {
  const rc: Wire.WireSummaries = {
    users: [],
    discussions: [],
  };
  const userIds: Set<number> = new Set<number>();
  discussionMessages.forEach((discussionMessage) => {
    const [discussion, message] = discussionMessage;
    const { id, name, tags } = discussion;
    userIds.add(message.userId);
    rc.discussions.push({
      id,
      name,
      tags: tags.map(getKeyFromTagId),
      userId: message.userId,
      messageExerpt: getExerpt(message.markdown),
      dateTime: message.dateTime,
      nAnswers: discussion.messages.length,
    });
  });
  userIds.forEach((userId) => rc.users.push(getUserSummary(userId)));
  return rc;
}

function wireDiscussion(
  discussion: BareDiscussion,
  messages: BareMessage[],
  range: Data.DiscussionRange
): Wire.WireDiscussion {
  const { id, name, tags, first } = discussion;
  const rc: Wire.WireDiscussion = {
    users: [],
    id,
    name,
    tags: tags.map(getKeyFromTagId),
    first,
    range,
    messages,
  };
  const userIds: Set<number> = new Set<number>();
  userIds.add(discussion.first.userId);
  messages.forEach((message) => userIds.add(message.userId));
  userIds.add(rc.first.userId);
  userIds.forEach((userId) => rc.users.push(getUserSummary(userId)));
  return rc;
}

function getRange<TSort, TElement>(
  nTotal: number,
  sort: TSort,
  pageSize: number,
  pageNumber: number,
  array: TElement[]
): {
  range: { nTotal: number; sort: TSort; pageSize: number; pageNumber: number };
  selected: TElement[];
} {
  const length = pageSize;
  const start = (pageNumber - 1) * pageSize;
  const selected = array.slice(start, start + length);
  return { range: { nTotal, sort, pageSize, pageNumber }, selected };
}

/*
  GET functions
*/

export function getSiteMap(): Data.SiteMap {
  return {
    images: allImages,
    tags: tagDiscussions.siteTagCounts(),
  };
}

export function getImage(id: number): Data.Image | undefined {
  return allImages.find((image) => image.id === id);
}

export function getUserSummaries(): Data.UserSummaryEx[] {
  const rc: Data.UserSummaryEx[] = [];
  allUsers.forEach((data, userId) => {
    const summary = getUserSummaryFrom(userId, data);
    // read the top 3 tag strings
    const tags = userTags
      .get(userId)!
      .readTop3()
      .map((it) => {
        return { key: it };
      });

    const summaryEx = { ...summary, tags: tags };
    rc.push(summaryEx);
  });
  return rc.sort((x, y) => x.name.localeCompare(y.name));
}

export function getUser(userId: number, userIdLogin?: number): Data.User | undefined {
  const data: BareUser | undefined = allUsers.get(userId);
  if (!data) {
    return undefined;
  }
  const preferences: Data.UserPreferences | undefined =
    userId !== userIdLogin
      ? undefined
      : {
          email: data.email,
        };
  const { id, name, gravatarHash, location } = getUserSummaryFrom(userId, data);
  return {
    id,
    name,
    location,
    gravatarHash,
    aboutMe: data.profile.aboutMe,
    preferences: preferences,
  };
}

export function getUserActivity(options: Url.UserActivityOptions): Wire.WireUserActivity | undefined {
  // same kind of processing as some combination of getDiscussions and getDiscussion
  // like getDiscussion, we don't have two pre-sorted arrays to choose from, so may have to select from a reversed copy
  const userId = options.user.id;
  const messages: BareMessage[] | undefined = userMessages.get(userId);
  if (!messages) return undefined;
  const sort: Url.ActivitySort = options.sort ? options.sort : "Oldest";
  const sortedMessages = sort === "Oldest" ? messages : messages.slice().reverse();
  // like getDiscussions
  const { range, selected } = getRange(messages.length, sort, 30, options.page ? options.page : 1, sortedMessages);
  const discussionMessages: [BareDiscussion, BareMessage][] = selected.map((message) => {
    const discussionId: number = messageDiscussions.get(message.messageId)!;
    const discussion: BareDiscussion = allDiscussions.get(discussionId)!;
    return [discussion, message];
  });
  const { users, discussions } = wireSummaries(discussionMessages);
  const tagCounts: BareTagCount[] = userTags.get(userId)!.read();
  return { users, discussions, range, tagCounts };
}

export function getDiscussions(options: Url.DiscussionsOptions): Wire.WireDiscussions {
  const sort: Url.DiscussionsSort = options.sort ? options.sort : "Active";
  const active = sort === "Active";
  // two collections of pre-sorted discussions (using different sort-orders) to choose from
  const sortedDiscussions: [number, number][] = active ? sortedDiscussionsActive : sortedDiscussionsNewest;
  const tag = options.tag;
  const filteredDiscussions = !tag
    ? sortedDiscussions
    : sortedDiscussions.filter((pair) => {
        const discussionId = pair[0];
        const discussion = allDiscussions.get(discussionId)!;
        for (const tagId of discussion.tags) {
          const found: Data.Key = getKeyFromTagId(tagId);
          if (found.key === tag.key) {
            return true;
          }
        }
        return false;
      });
  const getMessage: GetMessage = active ? getMessageEnded : getMessageStarted;
  const { range, selected } = getRange(
    filteredDiscussions.length,
    sort,
    options.pagesize ? options.pagesize : 50,
    options.page ? options.page : 1,
    filteredDiscussions
  );
  const discussionRange = { ...range, tag };
  const selectedDiscussions: BareDiscussion[] = selected.map((pair) => allDiscussions.get(pair[0])!);
  const discussionMessages: [BareDiscussion, BareMessage][] = selectedDiscussions.map((discussion) => [
    discussion,
    getMessage(discussion),
  ]);
  const { users, discussions } = wireSummaries(discussionMessages);
  return { users, discussions, range: discussionRange };
}

export function getDiscussion(options: Url.DiscussionOptions): Wire.WireDiscussion | undefined {
  const discussion = allDiscussions.get(options.discussion.id);
  if (!discussion) {
    return undefined;
  }
  const sort: Url.DiscussionSort = options.sort ? options.sort : "Oldest";
  const sortedMessages = sort === "Oldest" ? discussion.messages : discussion.messages.slice().reverse();
  const { range, selected } = getRange(
    discussion.messages.length,
    sort,
    30,
    options.page ? options.page : 1,
    sortedMessages
  );
  return wireDiscussion(discussion, selected, range);
}

export function getAllTags(): Data.TagCount[] {
  return tagDiscussions.tagCounts();
}

export function getTags(options: Url.TagsOptions, searchInput?: string): Data.Tags {
  const tags: Data.TagCount[] = getAllTags().filter((tagCount) =>
    !searchInput ? true : tagCount.key.includes(searchInput)
  );
  const sort: Url.TagsSort = options.sort ? options.sort : "Popular";
  if (options.sort === "Name") {
    tags.sort((x, y) => x.key.localeCompare(y.key));
  } else {
    tags.sort((x, y) => {
      return x.count === y.count ? x.key.localeCompare(y.key) : y.count - x.count;
    });
  }
  const { range, selected } = getRange(tags.length, sort, options.pagesize, options.page ? options.page : 1, tags);
  return { range, tagCounts: selected };
}

export function getTag(tag: Data.Key): Data.TagInfo | undefined {
  const tagId: TagId | undefined = tagDiscussions.find(tag.key);
  if (!tagId) {
    // should return 404 Not Found
    return undefined;
  }
  if (isTag(tagId)) {
    // ideally allags would be a map instead of an array, but in practice we don't have so many tags that it matters
    // also we're targetting down-level JS so it's inconvenient to iterate map values
    const found: BareTag = allTags.find((x) => x.key === tagId.tag)!;
    const { title, summary, markdown } = found;
    return { title, summary, markdown, key: tag.key };
  } else {
    if (tagId.resourceType !== "Image") {
      // should return 500 Internal Server Error
      return undefined;
    }
    const image: Data.Image = allImages.find((x) => x.id === tagId.id)!;
    const { name, summary, markdown } = image;
    return { title: name, summary, markdown, key: tag.key };
  }
}

/*
  POST functions
*/

function postNewUser(action: Action.NewUser): Data.IdName {
  const { userId, user } = Action.extractNewUser(action);
  allUsers.set(userId, user);
  userMessages.set(userId, []);
  userTags.set(userId, new TagIdCounts(allImages));
  return { id: userId, name: user.name };
}

function postEditUserProfile(action: Action.EditUserProfile): Data.IdName {
  const { userId, posted } = Action.extractEditUserProfile(action);
  const user = allUsers.get(userId)!;
  user.name = posted.name;
  user.email = posted.email;
  user.profile.location = posted.location;
  user.profile.aboutMe = posted.aboutMe;
  return { id: userId, name: user.name };
}

function postNewTopic(action: Action.NewTopic): Data.Key {
  const tag: BareTag = Action.extractNewTopic(action);
  if (!tagDiscussions.addTag(tag.key)) {
    // FIXME
    console.error("!postNewTopic");
  }
  allTags.push(tag);
  return { key: tag.key };
}

function postNewDiscussion(action: Action.NewDiscussion): Data.IdName {
  const { idName, tags, first: message } = Action.extractNewDiscussion(action);
  const discussionId = idName.id;
  // ensure that the tags exist and/or can be created
  const tagIds: TagId[] = [];
  for (const tag of tags) {
    let tagId = tagDiscussions.find(tag);
    if (!tagId) {
      if (!configServer.autoAddTag) {
        // FIXME

        console.error(`postNewDiscussion can't auto-add ${tag}`);
        continue;
      }
      // auto-create it now
      const newTopic: Action.NewTopic = Action.createNewTag(tag, action.dateTime, action.userId);
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
  tagIds.forEach((tagId) => tagDiscussions.addDiscussionId(tagId, discussionId));
  // new discussion
  const discussion: BareDiscussion = {
    id: idName.id,
    name: idName.name,
    tags: tagIds,
    first: message,
    messages: [],
  };
  allDiscussions.set(discussionId, discussion);
  const active = getDiscussionTime(discussion, getMessageStarted);
  sortedDiscussionsNewest.unshift(active);
  sortedDiscussionsActive.unshift(active);
  // the user owns this message
  userMessages.get(message.userId)!.push(message);
  // the message is associated with this discussion
  messageDiscussions.set(message.messageId, discussionId);
  return idName;
}

function postNewMessage(action: Action.NewMessage): Data.Message {
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
  discussion.tags.forEach((tagId) => userTags.get(message.userId)!.add(tagId));
  // the message is associated with this discussion
  messageDiscussions.set(message.messageId, discussionId);
  return {
    userSummary: getUserSummary(message.userId),
    markdown: message.markdown,
    dateTime: message.dateTime,
  };
}

function postEditTagInfo(action: Action.EditTagInfo): Data.Key | HttpStatus {
  // this logic is similar to getTag()
  const { tag, posted } = Action.extractEditTagInfo(action);
  const { summary, markdown } = posted;
  const tagId: TagId | undefined = tagDiscussions.find(tag);
  if (!tagId) {
    // should return 404 Not Found
    return { httpStatus: 404 };
  }
  if (isTag(tagId)) {
    // ideally allags would be a map instead of an array, but in practice we don't have so many tags that it matters
    // also we're targetting down-level JS so it's inconvenient to iterate map values
    const found: BareTag = allTags.find((x) => x.key === tagId.tag)!;
    found.summary = summary.length ? summary : undefined;
    found.markdown = markdown.length ? markdown : undefined;
  } else {
    if (tagId.resourceType !== "Image") {
      // should return 500 Internal Server Error
      return { httpStatus: 500 };
    }
    const image: Data.Image = allImages.find((x) => x.id === tagId.id)!;
    image.summary = summary;
    image.markdown = markdown.length ? markdown : undefined;
  }
  return { key: tag };
}

export function handleAction(action: Action.Any): Data.IdName | Data.Key | Data.Message | HttpStatus {
  switch (action.type) {
    case "NewUser":
      return postNewUser(action);
    case "EditUserProfile":
      return postEditUserProfile(action);
    case "NewTopic":
      return postNewTopic(action);
    case "NewDiscussion":
      return postNewDiscussion(action);
    case "NewMessage":
      return postNewMessage(action);
    case "EditTagInfo":
      return postEditTagInfo(action);
    default:
      return { httpStatus: 500 };
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
  actions.forEach((action) => {
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
