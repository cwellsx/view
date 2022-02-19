import { Api } from 'client';
import { Data, Post, SearchInput, Url } from 'shared-lib';

export const nullApi: Api = {
  // methods to get data
  getSiteMap: () => {
    throw new Error("nullApi getSiteMap() function called");
  },
  getImage: (image: Data.IdName) => {
    throw new Error("nullApi getImage() function called");
  },
  getUsers: () => {
    throw new Error("nullApi getUsers() function called");
  },
  getUser: (user: Data.IdName) => {
    throw new Error("nullApi getUser() function called");
  },
  getUserActivity: (options: Url.UserActivityOptions) => {
    throw new Error("nullApi getUserActivity() function called");
  },
  getDiscussions: (options: Url.DiscussionsOptions) => {
    throw new Error("nullApi getDiscussions() function called");
  },
  getDiscussion: (options: Url.DiscussionOptions) => {
    throw new Error("nullApi getDiscussion() function called");
  },
  getAllTags: () => {
    throw new Error("nullApi getAllTags() function called");
  },
  getTags: (options: Url.TagsOptions, data?: SearchInput) => {
    throw new Error("nullApi getTags() function called");
  },
  getTag: (tag: Data.Key) => {
    throw new Error("nullApi getTag() function called");
  },
  getPublic: (filename: string) => {
    throw new Error("nullApi getPublic() function called");
  },
  // methods to post data
  login: (data: Post.Login) => {
    throw new Error("nullApi login() function called");
  },
  newMessage: (discussionId: number, data: Post.NewMessage) => {
    throw new Error("nullApi newMessage() function called");
  },
  newDiscussion: (data: Post.NewDiscussion) => {
    throw new Error("nullApi newDiscussion() function called");
  },
  editUserProfile: (userId: number, data: Post.EditUserProfile) => {
    throw new Error("nullApi editUserProfile() function called");
  },
  editTagInfo: (tag: string, data: Post.EditTagInfo) => {
    throw new Error("nullApi editTagInfo() function called");
  },
};
