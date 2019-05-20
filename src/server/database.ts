import * as I from "../data";
import { BareUser, BareDiscussion, BareMessage } from "./bare";
import { loadUsers, loadImages, loadTags, loadDiscussions } from "./loader";
import { WireDiscussions, WireDiscussion } from "../shared/wire";
import { getExerpt } from "../shared/exerpt";
import { DiscussionsOptions, DiscussionOptions } from "../shared/request";

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
const { sortedDiscussionsNewest, sortedDiscussionsActive } = loadSortedDiscussions(allDiscussions);

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
  return discussion.messages[0];
}

function getMessageEnded(discussion: BareDiscussion): BareMessage {
  return discussion.messages[discussion.messages.length - 1];
}

type GetMessage = (x: BareDiscussion) => BareMessage;

function getMessageTime(discussion: BareDiscussion, getMessage: GetMessage): [number, number] {
  return [discussion.meta.idName.id, new Date(getMessage(discussion).dateTime).getTime()];
}

function discussionStartedAt(discussion: BareDiscussion): [number, number] {
  return getMessageTime(discussion, getMessageStarted);
}

function discussionEndedAt(discussion: BareDiscussion): [number, number] {
  return getMessageTime(discussion, getMessageEnded);
}

function loadSortedDiscussions(map: Map<number, BareDiscussion>)
  : { sortedDiscussionsNewest: [number, number][], sortedDiscussionsActive: [number, number][] } {
  const sortedDiscussionsNewest: [number, number][] = [];
  const sortedDiscussionsActive: [number, number][] = [];
  map.forEach((value) => {
    sortedDiscussionsNewest.push(discussionStartedAt(value));
    sortedDiscussionsActive.push(discussionEndedAt(value));
    value.messages.forEach(message => {
      if (!allUsers.get(message.userId)) {
        throw new Error(`Unknown userId ${message.userId}`);
      }
    });
  });
  sortDiscussions(sortedDiscussionsNewest);
  sortDiscussions(sortedDiscussionsActive);
  return { sortedDiscussionsNewest, sortedDiscussionsActive };
}

function sortDiscussions(index: [number, number][]): void {
  index.sort((x, y) => y[1] - x[1]);
}

function wireDiscussionSummaries(discussions: BareDiscussion[], getMessage: GetMessage, range: I.DiscussionsRange):
  WireDiscussions {
  const rc: WireDiscussions = {
    users: [],
    discussions: [],
    range
  }
  const userIds: Set<number> = new Set<number>();
  discussions.forEach(discussion => {
    const message: BareMessage = getMessage(discussion);
    userIds.add(message.userId);
    rc.discussions.push({
      idName: discussion.meta.idName,
      tag: discussion.meta.tag,
      userId: message.userId,
      messageExerpt: getExerpt(message.markdown),
      dateTime: message.dateTime,
      nAnswers: discussion.messages.length - 1
    });
  });
  userIds.forEach(userId => rc.users.push(getUserSummary(userId)));
  return rc;
}

function wireDiscussion(discussion: BareDiscussion, messages: BareMessage[], range: I.DiscussionRange): WireDiscussion {
  const rc: WireDiscussion = {
    users: [],
    meta: discussion.meta,
    first: discussion.messages[0],
    range,
    messages
  }
  const userIds: Set<number> = new Set<number>();
  messages.forEach(message => userIds.add(message.userId));
  userIds.add(rc.first.userId);
  userIds.forEach(userId => rc.users.push(getUserSummary(userId)));
  return rc;
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

export function getDiscussions(options: DiscussionsOptions): WireDiscussions {
  const range: I.DiscussionsRange = {
    nTotal: allDiscussions.size,
    sort: options.sort ? options.sort : "Active",
    pageSize: options.pagesize ? options.pagesize : 50,
    pageNumber: options.page ? options.page : 1
  }
  const active = range.sort === "Active";
  const sortedDiscussions: [number, number][] = (active) ? sortedDiscussionsActive : sortedDiscussionsNewest;
  const getMessage: GetMessage = (active) ? getMessageEnded : getMessageStarted;
  const length = range.pageSize;
  const start = (range.pageNumber - 1) * range.pageSize;
  const selected = sortedDiscussions.slice(start, start + length).map((pair) => allDiscussions.get(pair[0])!);
  return wireDiscussionSummaries(selected, getMessage, range);
}

export function getDiscussion(options: DiscussionOptions): WireDiscussion | undefined {
  const discussion = allDiscussions.get(options.discussion.id);
  if (!discussion) {
    return undefined;
  }
  if (!discussion.messages.length) {
    // should be error 500 or something like that
    return undefined;
  }
  const range: I.DiscussionRange = {
    nTotal: discussion.messages.length - 1,
    sort: options.sort ? options.sort : "Oldest",
    pageSize: 30,
    pageNumber: options.page ? options.page : 1
  }
  const length = range.pageSize;
  const start = ((range.pageNumber - 1) * range.pageSize) + 1;
  const selected = discussion.messages.slice(start, start + length);
  if (range.sort==="Newest") {
    selected.reverse();
  }
  return wireDiscussion(discussion, selected, range);
}
