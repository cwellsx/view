import * as I from "../data";
import * as Post from "./post";
import * as Mock from "./mock";
import { PageId, getPageUrl } from "./pageId";
import { config } from "../config"

// this declares a subset of the fields we use from the DOM Response interface
interface SimpleResponse {
  readonly ok: boolean;
  readonly statusText: string;
  json(): Promise<any>;
}

function mockData(pageId: PageId): object | undefined {
  if (pageId.pageType === "SiteMap") {
    return Mock.siteMap;
  }
  if (pageId.pageType === "Login") {
    return Mock.loginUser;
  }
  return undefined;
}

function mock(pageId: PageId): Promise<SimpleResponse> {
  return new Promise<SimpleResponse>((resolve, reject) => {
    const delay = 25;
    setTimeout(() => {
      if (config.loginfails) {
        // simulate login failure
        const failPromise: Promise<any> = new Promise<any>((resolve, reject) => {
          // no possible need to call reject because we already have the data
          reject("Don't get JSON if request failed");
        });
        const failure: SimpleResponse = {
          ok: false,
          statusText: "Unauthorized",
          json: () => failPromise
        };
        resolve(failure);
        return;
      }
      const json = mockData(pageId);
      if (!json) {
        // from inside setTimeout we must reject not throw
        // https://stackoverflow.com/questions/33445415/javascript-promises-reject-vs-throw
        reject(new Error(`No mock data found for ${getPageUrl(pageId)}`));
      }
      const jsonPromise: Promise<any> = new Promise<any>((resolve, reject) => {
        // no possible need to call reject because we already have the data
        resolve(json);
      });
      const response: SimpleResponse = {
        ok: true,
        statusText: "OK",
        json: () => jsonPromise
      };
      resolve(response);
    }, delay);
  });
}

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
    return mock(pageId);
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

export async function login(data: Post.Login): Promise<I.UserSummary> {
  return getT<I.UserSummary>({ pageType: "Login" }, data);
}
