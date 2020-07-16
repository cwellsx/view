import { Data, Message, Post, SearchInput, SimpleResponse, Url } from "shared-lib";

// you could temporarily change this to enable logging, for debugging
const isLogging = false;

export interface Api {
  // methods to get data
  getSiteMap(): Promise<Data.SiteMap>;
  getImage(image: Data.IdName): Promise<Data.Image>;
  getUsers(): Promise<Data.UserSummaryEx[]>;
  getUser(user: Data.IdName): Promise<Data.User>;
  getUserActivity(options: Url.UserActivityOptions): Promise<Data.UserActivity>;
  getDiscussions(options: Url.DiscussionsOptions): Promise<Data.Discussions>;
  getDiscussion(options: Url.DiscussionOptions): Promise<Data.Discussion>;
  getAllTags(): Promise<Data.TagCount[]>;
  getTags(options: Url.TagsOptions, data?: SearchInput): Promise<Data.Tags>;
  getTag(tag: Data.Key): Promise<Data.TagInfo>;
  getPublic(filename: string): Promise<string>;
  // methods to post data
  login(data: Post.Login): Promise<Data.UserSummary>;
  newMessage(discussionId: number, data: Post.NewMessage): Promise<Data.Message>;
  newDiscussion(data: Post.NewDiscussion): Promise<Data.IdName>;
  editUserProfile(userId: number, data: Post.EditUserProfile): Promise<Data.IdName>;
  editTagInfo(tag: string, data: Post.EditTagInfo): Promise<Data.Key>;
}

interface MockFetch {
  (url: string, body?: object): Promise<SimpleResponse>;
}

export function getApi(mockFetch?: MockFetch): Api {
  function get(url: string, body?: object): Promise<SimpleResponse> {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

    if (!mockFetch) {
      const init: RequestInit = {};

      if (body) {
        init.method = "POST";
        init.body = JSON.stringify(body);
        init.headers = {
          "Content-Type": "application/json",
        };
      }

      return fetch(url, init);
    } else {
      return mockFetch(url, body);
    }
  }

  // https://stackoverflow.com/questions/41103360/how-to-use-fetch-in-typescript
  function getT<T>(url: string, body?: object): Promise<T> {
    if (isLogging) {
      console.log(`getT(${url})`);
    }
    return get(url, body).then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json() as Promise<T>;
    });
  }

  /*
  function to get data
*/

  async function getSiteMap(): Promise<Data.SiteMap> {
    return getT<Data.SiteMap>(Url.getSiteMapUrl());
  }

  async function getImage(image: Data.IdName): Promise<Data.Image> {
    return getT<Data.Image>(Url.getImageUrl(image));
  }

  async function getUsers(): Promise<Data.UserSummaryEx[]> {
    return getT<Data.UserSummaryEx[]>(Url.getUsersUrl());
  }

  async function getUser(user: Data.IdName): Promise<Data.User> {
    return getT<Data.User>(Url.getUserUrl(user));
  }

  function convertPromise<TWire, TData>(promise: Promise<TWire>, convert: (wire: TWire) => TData): Promise<TData> {
    const rc: Promise<TData> = new Promise<TData>((resolve, reject) => {
      promise.then((wire: TWire) => {
        const wanted: TData = convert(wire);
        resolve(wanted);
      });
      promise.catch((error) => {
        reject(error);
      });
    });
    return rc;
  }

  async function getUserActivity(options: Url.UserActivityOptions): Promise<Data.UserActivity> {
    const url = Url.getUserActivityUrl(options);
    const wirePromise: Promise<Message.WireUserActivity> = getT<Message.WireUserActivity>(url);
    return convertPromise(wirePromise, Message.unwireUserActivity);
  }

  async function getDiscussions(options: Url.DiscussionsOptions): Promise<Data.Discussions> {
    const url = Url.getDiscussionsOptionsUrl(options);
    const wirePromise: Promise<Message.WireDiscussions> = getT<Message.WireDiscussions>(url);
    return convertPromise(wirePromise, Message.unwireDiscussions);
  }

  async function getDiscussion(options: Url.DiscussionOptions): Promise<Data.Discussion> {
    const url = Url.getDiscussionOptionsUrl(options);
    const wirePromise: Promise<Message.WireDiscussion> = getT<Message.WireDiscussion>(url);
    return convertPromise(wirePromise, Message.unwireDiscussion);
  }

  async function getAllTags(): Promise<Data.TagCount[]> {
    return getT<Data.TagCount[]>(Url.getAllTagsUrl());
  }

  async function getTags(options: Url.TagsOptions, data?: SearchInput): Promise<Data.Tags> {
    const url = Url.getTagsOptionsUrl(options);
    return getT<Data.Tags>(url, data);
  }

  async function getTag(tag: Data.Key): Promise<Data.TagInfo> {
    const url = Url.getTagKeyUrl(tag);
    return getT<Data.TagInfo>(url);
  }

  /*
  function to post data
*/

  async function login(data: Post.Login): Promise<Data.UserSummary> {
    return getT<Data.UserSummary>(Url.postLoginUrl(), data);
  }

  async function newMessage(discussionId: number, data: Post.NewMessage): Promise<Data.Message> {
    return getT<Data.Message>(Url.postNewAnswerUrl(discussionId), data);
  }

  async function newDiscussion(data: Post.NewDiscussion): Promise<Data.IdName> {
    return getT<Data.IdName>(Url.postNewDiscussionUrl(), data);
  }

  async function editUserProfile(userId: number, data: Post.EditUserProfile): Promise<Data.IdName> {
    return getT<Data.IdName>(Url.postEditUserProfileUrl(userId), data);
  }

  async function editTagInfo(tag: string, data: Post.EditTagInfo): Promise<Data.Key> {
    return getT<Data.Key>(Url.postEditTagInfoUrl(tag), data);
  }

  /*
  function to get markdown

  it's difficult to import markdown into the server

  for example `import home from "../server_data/home.md";` seem to work

  this comment involves a babel macro which might work ...

  https://github.com/facebook/create-react-app/issues/3722#issuecomment-458124126

  ... but instead the following uses fetch to read the file from the public directory.
*/

  async function getPublic(filename: string): Promise<string> {
    const headers: Headers = new Headers();
    headers.append("Accept", "application/json");
    headers.append("pragma", "no-cache");
    headers.append("cache-control", "no-cache");
    const init: RequestInit = {
      headers,
    };
    const promise: Promise<Response> = fetch(filename, init);
    const result: Promise<string> = new Promise<string>((resolve, reject) => {
      promise
        .then((response: Response) => {
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
        })
        .catch((reason) => {
          console.error(reason.error);
          reject(reason);
        });
    });
    return result;
  }

  return {
    // methods to get data
    getSiteMap,
    getImage,
    getUsers,
    getUser,
    getUserActivity,
    getDiscussions,
    getDiscussion,
    getAllTags,
    getTags,
    getTag,
    // methods to post data
    login,
    newMessage,
    newDiscussion,
    editUserProfile,
    editTagInfo,
    getPublic,
  };
}
