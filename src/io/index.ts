import * as I from "../data";
import * as W from "../shared/wire"
import * as Post from "../shared/post";
import * as R from "../shared/urls";
import { config } from "../config"
// only used for the mock
import { SimpleResponse, mockFetch } from "../io/mock";

// you could temporarily change this to enable logging, for debugging
const isLogging = false;

function get(url: string, body?: object): Promise<SimpleResponse> {
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
function getT<T>(url: string, body?: object): Promise<T> {
  if (isLogging) {
    console.log(`getT(${url})`);
  }
  return get(url, body)
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
  return getT<I.SiteMap>(R.getSiteMapUrl());
}

export async function getImage(image: I.IdName): Promise<I.Image> {
  return getT<I.Image>(R.getImageUrl(image));
}

export async function getUsers(): Promise<I.UserSummaryEx[]> {
  return getT<I.UserSummaryEx[]>(R.getUsersUrl());
}

export async function getUser(user: I.IdName): Promise<I.User> {
  return getT<I.User>(R.getUserUrl(user));
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
  const url = R.getUserActivityUrl(options)
  const wirePromise: Promise<W.WireUserActivity> = getT<W.WireUserActivity>(url);
  return convertPromise(wirePromise, W.unwireUserActivity);
}

export async function getDiscussions(options: R.DiscussionsOptions): Promise<I.Discussions> {
  const url = R.getDiscussionsOptionsUrl(options);
  const wirePromise: Promise<W.WireDiscussions> = getT<W.WireDiscussions>(url);
  return convertPromise(wirePromise, W.unwireDiscussions);
}

export async function getDiscussion(options: R.DiscussionOptions): Promise<I.Discussion> {
  const url = R.getDiscussionOptionsUrl(options);
  const wirePromise: Promise<W.WireDiscussion> = getT<W.WireDiscussion>(url);
  return convertPromise(wirePromise, W.unwireDiscussion);
}

export async function getAllTags(): Promise<I.TagCount[]> {
  return getT<I.TagCount[]>(R.getAllTagsUrl());
}

export async function getTags(options: R.TagsOptions): Promise<I.Tags> {
  const url = R.getTagsOptionsUrl(options);
  return getT<I.Tags>(url);
}

export async function getTag(tag: I.Key): Promise<I.TagInfo> {
  const url = R.getTagKeyUrl(tag);
  return getT<I.TagInfo>(url);
}

/*
  function to post data
*/

export async function login(data: Post.Login): Promise<I.UserSummary> {
  return getT<I.UserSummary>(R.postLoginUrl(), data);
}

export async function newMessage(discussionId: number, data: Post.NewMessage): Promise<I.Message> {
  return getT<I.Message>(R.postNewAnswerUrl(discussionId), data);
}

export async function newDiscussion(data: Post.NewDiscussion): Promise<I.IdName> {
  return getT<I.IdName>(R.postNewDiscussionUrl(), data);
}

export async function editUserProfile(userId: number, data: Post.EditUserProfile): Promise<I.IdName> {
  return getT<I.IdName>(R.postEditUserProfileUrl(userId), data);
}

export async function editTagInfo(tag: string, data: Post.EditTagInfo): Promise<I.Key> {
  return getT<I.Key>(R.postEditTagInfoUrl(tag), data);
}

/*
  function to get markdown

  it's difficult to import markdown into the server

  for example `import home from "../server_data/home.md";` seem to work

  this comment involves a babel macro which might work ...

  https://github.com/facebook/create-react-app/issues/3722#issuecomment-458124126

  ... but instead the following uses fetch to read the file from the public directory.
*/

export async function getPublic(filename: string): Promise<string> {

  const headers: Headers = new Headers();
  headers.append("Accept", "application/json");
  headers.append("pragma", "no-cache");
  headers.append("cache-control", "no-cache");
  const init: RequestInit = {
    headers
  };
  const promise: Promise<Response> = fetch(filename, init);
  const result: Promise<string> = new Promise<string>((resolve, reject) => {
    promise.then((response: Response) => {
      if (!response.ok) {
        const error = new Error(`${response.status} ${response.statusText}`);
        (error as any).url = filename;
        console.error(error.message);
        reject(error);
      }
      response.text().then((text: string) => {
        // console.log(text);
        resolve(text);
      });
    }).catch((reason) => {
      console.error(reason.error);
      reject(reason);
    });
  });
  return result;
}