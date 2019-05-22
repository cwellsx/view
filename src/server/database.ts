import * as I from "../data";
import { BareUser, BareDiscussion, BareMessage } from "./bare";
import { loadUsers, loadImages, loadTags, loadDiscussions } from "./loader";
import { WireSummaries, WireDiscussions, WireDiscussion, WireUserActivity, WireMessage } from "../shared/wire";
import { getExerpt } from "../shared/exerpt";
import * as R from "../shared/request";
import { TagIdCounts } from "./tagsDatabase";

/*
  This is an in-RAM database
  or its API wraps an external database.
*/

/*
  Data -- not exported
*/

const allUsers: Map<number, BareUser> = loadUsers();

const allImages: I.Image[] = loadImages();

const allTags: I.Tag[] = loadTags();

const allDiscussions: Map<number, BareDiscussion> = loadDiscussions();
// [discussionId, time]
const { sortedDiscussionsNewest, sortedDiscussionsActive } = sortAllDiscussions(allDiscussions);
// Map<number, BareMessage[]> and Map<number, number> and userTags: Map<number, TagIdCounts>
const { userMessages, messageDiscussions, userTags } = sortAllMessages(allDiscussions);

/*
  functions to sort and index data when it's first loaded from disk
*/

function sortAllDiscussions(map: Map<number, BareDiscussion>)
  : { sortedDiscussionsNewest: [number, number][], sortedDiscussionsActive: [number, number][] } {
  const sortedDiscussionsNewest: [number, number][] = [];
  const sortedDiscussionsActive: [number, number][] = [];

  function sortDiscussions(index: [number, number][]): void {
    index.sort((x, y) => y[1] - x[1]);
  }

  map.forEach((discussion) => {
    sortedDiscussionsNewest.push(getMessageTime(discussion, getMessageStarted));
    sortedDiscussionsActive.push(getMessageTime(discussion, getMessageEnded));
    discussion.messages.forEach(message => {
      if (!allUsers.get(message.userId)) {
        throw new Error(`Unknown userId ${message.userId}`);
      }
    });
  });
  sortDiscussions(sortedDiscussionsNewest);
  sortDiscussions(sortedDiscussionsActive);
  return { sortedDiscussionsNewest, sortedDiscussionsActive };
}

function sortAllMessages(map: Map<number, BareDiscussion>)
  : {
    userMessages: Map<number, BareMessage[]>,
    messageDiscussions: Map<number, number>,
    userTags: Map<number, TagIdCounts>
  } {
  const userMessages: Map<number, BareMessage[]> = new Map<number, BareMessage[]>();
  const messageDiscussions: Map<number, number> = new Map<number, number>();
  const userTags: Map<number, TagIdCounts> = new Map<number, TagIdCounts>();

  // initialize the per-user maps
  allUsers.forEach((user, key) => {
    userMessages.set(key, []);
    userTags.set(key, new TagIdCounts());
  });

  // get all messages (and all tags) from all discussions
  map.forEach(discussion => {
    discussion.messages.forEach(message => {
      messageDiscussions.set(message.messageId, discussion.meta.idName.id);
      userMessages.get(message.userId)!.push(message);
      userTags.get(message.userId)!.add(discussion.meta.tag);
    })
  });

  // sort messages by date (instead of sorted by discussion)
  userMessages.forEach((value, userId) => {
    const pairs: [WireMessage, number][] = value.map(message => [message, new Date(message.dateTime).getTime()]);
    pairs.sort((x, y) => x[1] - y[1]);
    userMessages.set(userId, pairs.map(pair => pair[0]));
  });
  return { userMessages, messageDiscussions, userTags };
}

/*
  helper functions
*/

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

function getMessageTime(discussion: BareDiscussion, getMessage: GetMessage): [number, number] {
  return [discussion.meta.idName.id, new Date(getMessage(discussion).dateTime).getTime()];
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
      tag: discussion.meta.tag,
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
    meta: discussion.meta,
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
    images: allImages.map(image => image.summary),
    tags: allTags.map(tag => { return { key: tag.key, summary: tag.summary }; })
  };
}

export function getImage(id: number): I.Image | undefined {
  return allImages.find(image => image.summary.idName.id === id);
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
  const favourites = userTags.get(userId)!.read(allImages.map(image => image.summary.idName));
  return { users, discussions, range, favourites };
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
