import * as I from "../data";
import { WireDiscussions, unwireDiscussions, WireDiscussion, unwireDiscussion } from "../shared/wire"
import * as Post from "../shared/post";
import { Resource, getResourceUrl, requestResource } from "../shared/request";
import * as R from "../shared/request";
import { config } from "../config"
// only used for the mock
import { SimpleResponse, mockFetch } from "../io/mock";

function get(resource: Resource, body?: object): Promise<SimpleResponse> {
  const url = getResourceUrl(resource);
  if (!config.serverless) {
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

    return fetch(url, init);
  } else {
    return mockFetch(url);
  }
}

// https://stackoverflow.com/questions/41103360/how-to-use-fetch-in-typescript
function getT<T>(resource: Resource, body?: object): Promise<T> {
  return get(resource, body)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json() as Promise<T>;
    })
}

export async function getSiteMap(): Promise<I.SiteMap> {
  return getT<I.SiteMap>({ resourceType: "SiteMap" });
}

export async function getImage(id: number): Promise<I.Image> {
  return getT<I.Image>(requestResource("Image", id));
}

export async function login(data: Post.Login): Promise<I.UserSummary> {
  return getT<I.UserSummary>({ resourceType: "Login" }, data);
}

export async function getUsers(): Promise<I.UserSummaryEx[]> {
  return getT<I.UserSummaryEx[]>({ resourceType: "User" });
}

export async function getUser(id: number): Promise<I.User> {
  return getT<I.User>(requestResource("User", id));
}

export async function getUserActivity(id: number): Promise<I.UserActivity> {
  throw new Error("not yet implemented");
}

export async function getDiscussions(options: R.DiscussionsOptions): Promise<I.Discussions> {
  const url = R.getDiscussionsResource(options);
  const wirePromise: Promise<WireDiscussions> = getT<WireDiscussions>(url);
  const rc: Promise<I.Discussions> = new Promise<I.Discussions>((resolve, reject) => {
    wirePromise.then((wire: WireDiscussions) => {
      const wanted: I.Discussions = unwireDiscussions(wire);
      resolve(wanted);
    })
    wirePromise.catch(error => {
      reject(error);
    });
  });
  return rc;
}

export async function getDiscussion(options: R.DiscussionOptions): Promise<I.Discussion> {
  const url = R.getDiscussionResource(options);
  const wirePromise: Promise<WireDiscussion> = getT<WireDiscussion>(url);
  const rc: Promise<I.Discussion> = new Promise<I.Discussion>((resolve, reject) => {
    wirePromise.then((wire: WireDiscussion) => {
      const wanted: I.Discussion = unwireDiscussion(wire);
      resolve(wanted);
    })
    wirePromise.catch(error => {
      reject(error);
    });
  });
  return rc;
}
