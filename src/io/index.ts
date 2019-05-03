import * as I from "../data";
import * as Mock from "./mock";

const serverless = true;

// this declares a subset of the fields we use from the DOM Response interface
interface SimpleResponse {
  readonly ok: boolean;
  readonly statusText: string;
  json(): Promise<any>;
}

function mockData(url: string): object | undefined {
  if (url.startsWith("/index")) {
    return Mock.siteMap;
  }
  return undefined;
}

function mock(url: string): Promise<SimpleResponse> {
  return new Promise<SimpleResponse>((resolve, reject) => {
    const delay = 200;
    setTimeout(() => {
      const json = mockData(url);
      if (!json) {
        // from inside setTimeout we must reject not throw
        // https://stackoverflow.com/questions/33445415/javascript-promises-reject-vs-throw
        reject(new Error(`No mock data found for ${url}`));
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

function get(url: string): Promise<SimpleResponse> {
  if (!serverless) {
    return fetch(url);
  } else {
    return mock(url);
  }
}

// https://stackoverflow.com/questions/41103360/how-to-use-fetch-in-typescript
function getT<T>(url: string): Promise<T> {
  return get(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json() as Promise<T>;
    })
}

export async function getSiteMap(): Promise<I.SiteMap> {
  return getT<I.SiteMap>("/index");
}
