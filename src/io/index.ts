import * as I from "../data";
import * as W from "../shared/wire"
import * as Post from "../shared/post";
import * as R from "../shared/request";
import { config } from "../config"
// only used for the mock
import { SimpleResponse, mockFetch } from "../io/mock";

function get(resource: R.Resource, body?: object): Promise<SimpleResponse> {
  const url = (body) ? R.postResourceUrl(resource) : R.getResourceUrl(resource);
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  const init: RequestInit = {

  }

  if (body) {
    init.method = "POST";
    init.body = JSON.stringify(body);
    init.headers = {
      "Content-Type": "application/json",
    };
  }

  if (!config.serverless) {
    return fetch(url, init);
  } else {
    return mockFetch(url, init);
  }
}

// https://stackoverflow.com/questions/41103360/how-to-use-fetch-in-typescript
function getT<T>(resource: R.Resource, body?: object): Promise<T> {
  return get(resource, body)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json() as Promise<T>;
    })
}

/*
  function to get data
*/

export async function getSiteMap(): Promise<I.SiteMap> {
  return getT<I.SiteMap>({ resourceType: "SiteMap" });
}

export async function getImage(id: number): Promise<I.Image> {
  return getT<I.Image>({ resourceType: "Image", what: R.requestIdName(id) });
}

export async function getUsers(): Promise<I.UserSummaryEx[]> {
  return getT<I.UserSummaryEx[]>({ resourceType: "User" });
}

export async function getUser(id: number): Promise<I.User> {
  return getT<I.User>({ resourceType: "User", what: R.requestIdName(id) });
}

function convertPromise<TWire, TData>(promise: Promise<TWire>, convert: (wire: TWire) => TData): Promise<TData> {
  const rc: Promise<TData> = new Promise<TData>((resolve, reject) => {
    promise.then((wire: TWire) => {
      const wanted: TData = convert(wire);
      resolve(wanted);
    })
    promise.catch(error => {
      reject(error);
    });
  });
  return rc;
}

export async function getUserActivity(options: R.UserActivityOptions): Promise<I.UserActivity> {
  const resource = R.getUserActivityResource(options)
  const wirePromise: Promise<W.WireUserActivity> = getT<W.WireUserActivity>(resource);
  return convertPromise(wirePromise, W.unwireUserActivity);
}

export async function getDiscussions(options: R.DiscussionsOptions): Promise<I.Discussions> {
  const resource = R.getDiscussionsResource(options);
  const wirePromise: Promise<W.WireDiscussions> = getT<W.WireDiscussions>(resource);
  return convertPromise(wirePromise, W.unwireDiscussions);
}

export async function getDiscussion(options: R.DiscussionOptions): Promise<I.Discussion> {
  const resource = R.getDiscussionResource(options);
  const wirePromise: Promise<W.WireDiscussion> = getT<W.WireDiscussion>(resource);
  return convertPromise(wirePromise, W.unwireDiscussion);
}

export async function getAllTags(): Promise<I.TagCount[]> {
  return getT<I.TagCount[]>({ resourceType: "Tag" });
}

/*
  function to post data
*/

export async function login(data: Post.Login): Promise<I.UserSummary> {
  return getT<I.UserSummary>({ resourceType: "Login" }, data);
}

export async function newMessage(discussionId: number, data: Post.NewMessage): Promise<I.Message> {
  return getT<I.Message>(
    { resourceType: "Discussion", what: R.requestIdName(discussionId), post: "answer/submit" }, data);
}

export async function newDiscussion(data: Post.NewDiscussion): Promise<I.IdName> {
  return getT<I.IdName>({ resourceType: "Discussion", word: "new" }, data);
}

