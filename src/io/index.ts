import * as I from "../data";
import * as Post from "./post";
import { PageId, getPageUrl, requestPageId } from "./pageId";
import { config } from "../config"
// only used for the mock
import { SimpleResponse, mockFetch } from "../io/mock";

function get(pageId: PageId, body?: object): Promise<SimpleResponse> {
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

    const url = getPageUrl(pageId);
    return fetch(url, init);
  } else {
    return mockFetch(pageId);
  }
}

// https://stackoverflow.com/questions/41103360/how-to-use-fetch-in-typescript
function getT<T>(pageId: PageId, body?: object): Promise<T> {
  return get(pageId, body)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json() as Promise<T>;
    })
}

export async function getSiteMap(): Promise<I.SiteMap> {
  return getT<I.SiteMap>({ pageType: "SiteMap" });
}

export async function getImage(id: number): Promise<I.Image> {
  return getT<I.Image>(requestPageId("Image", id));
}

export async function login(data: Post.Login): Promise<I.UserSummary> {
  return getT<I.UserSummary>({ pageType: "Login" }, data);
}

export async function getUsers(): Promise<I.UserSummaryEx[]> {
  return getT<I.UserSummaryEx[]>({ pageType: "User" });
}

export async function getUser(id: number): Promise<I.User> {
  return getT<I.User>(requestPageId("User", id));
}

export async function getUserActivity(id: number): Promise<I.UserActivity> {
  throw new Error("not yet implemented");
}
