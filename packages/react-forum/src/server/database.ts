import * as I from "../data";
import { BareUser, BareDiscussion, BareMessage } from "./bare";
import { loadUsers, loadImages, loadFeatures, loadDiscussions } from "./loader";
import { WireDiscussionSummaries } from "../data/Wire";
import { getExerpt } from "../data/Exerpt";

/*
  This is an in-RAM database
  or its API wraps an external database.
*/

/*
  Data -- not exported
*/

const allUsers: Map<number, BareUser> = loadUsers();

const allImages: I.Image[] = loadImages();

const allFeatures: I.FeatureSummary[] = loadFeatures();

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

function wireDiscussionSummaries(discussions: BareDiscussion[], getMessage: GetMessage): WireDiscussionSummaries {
  const rc: WireDiscussionSummaries = {
    users: [],
    topics: [],
    discussions: []
  }
  const userIds: Set<number> = new Set<number>();
  const topics: I.TopicSummary[] = [];
  discussions.forEach(discussion => {
    const message: BareMessage = getMessage(discussion);
    const topicSummary: I.TopicSummary = discussion.meta.topicSummary;
    userIds.add(message.userId);
    topics.push(topicSummary);
    rc.discussions.push({
      idName: discussion.meta.idName,
      userId: message.userId,
      topic: { id: topicSummary.idName.id, pageType: topicSummary.pageType },
      messageExerpt: getExerpt(message.markdown),
      dateTime: message.dateTime,
      nAnswers: discussion.messages.length - 1
    });
  });
  rc.topics = topics;
  userIds.forEach(userId => rc.users.push(getUserSummary(userId)));
  return rc;
}

/*
  GET functions
*/

export function getSiteMap(): I.SiteMap {
  return {
    images: allImages.map(image => image.summary),
    features: allFeatures
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

export function getDiscussions(): WireDiscussionSummaries {
  const sortedDiscussions: [number, number][] = sortedDiscussionsActive;
  const getMessage: GetMessage = getMessageEnded;
  const start = 0;
  const length = 50;
  const selectedDiscussions = sortedDiscussions.slice(start, start + length).map((pair) => allDiscussions.get(pair[0])!);
  return wireDiscussionSummaries(selectedDiscussions, getMessage);
}