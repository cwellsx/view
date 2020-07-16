import { Data, Url } from "client/src";
import React from "react";

import { FetchingT, useApi, useFetchApi, useFetchApi2 } from "./hooks";
import { FetchedT, getPage, renderLayout, ShowDataT } from "./layouts";
import * as Page from "./routes";

export { notFound } from "./routes";

export const NewDiscussion: React.FunctionComponent = () => {
  // this is unusual because we don't need to fetch data before rendering this element
  return renderLayout(Page.showNewDiscussion());
};
export const Login: React.FunctionComponent = () => {
  // this is unusual because we don't need to fetch data before rendering this element
  return renderLayout(Page.showLogin());
};

export const SiteMap: React.FunctionComponent = () => {
  const { api, cache } = useApi();
  return getPage(useFetchApi(api.getSiteMap, cache.getSiteMap), Page.showSiteMap);
};

export const Discussions: React.FunctionComponent<Url.DiscussionsOptions> = (props: Url.DiscussionsOptions) => {
  const { sort, pagesize, page, tag } = props;
  const options: Url.DiscussionsOptions = React.useMemo(() => {
    return { sort, pagesize, page, tag };
  }, [sort, pagesize, page, tag]);

  const { api, cache } = useApi();
  return getPage(useFetchApi2(api.getDiscussions, options, cache.getDiscussions), Page.showDiscussions);
};

export const Home: React.FunctionComponent = () => {
  const isHtml = false;
  const filename = isHtml ? "home.html" : "home.md";
  const { api, cache } = useApi();
  const fetching: FetchingT<string, void> = useFetchApi2(api.getPublic, filename, cache.getPublic);
  const showData: ShowDataT<string, void> = (fetched: FetchedT<string, void>) => Page.showHome(fetched, { isHtml });
  return getPage(fetching, showData);
};

export const Users: React.FunctionComponent = () => {
  const { api, cache } = useApi();
  return getPage(useFetchApi(api.getUsers, cache.getUsers), Page.showUsers);
};

export const Tags: React.FunctionComponent<Url.TagsOptions> = (props: Url.TagsOptions) => {
  const { sort, pagesize, page } = props;
  const options: Url.TagsOptions = React.useMemo(() => {
    return { sort, pagesize, page };
  }, [sort, pagesize, page]);

  const { api, cache } = useApi();
  return getPage(useFetchApi2(api.getTags, options, cache.getTags), Page.showTags);
};

// these are used as TExtra types
type UserCanEdit = { canEdit: boolean };

type UserProps = Data.IdName & UserCanEdit;
export const UserProfile: React.FunctionComponent<UserProps> = (props: UserProps) => {
  const { id, name, canEdit } = props;
  const idName = React.useMemo<Data.IdName>(() => {
    return { id, name };
  }, [id, name]);

  const { api, cache } = useApi();
  const fetching: FetchingT<Data.User, void> = useFetchApi2(api.getUser, idName, cache.getUser);
  const showData: ShowDataT<Data.User, void> = (fetched: FetchedT<Data.User, void>) =>
    Page.showUserProfile(fetched, { canEdit });

  return getPage(fetching, showData);
};

export const UserEditSettings: React.FunctionComponent<UserProps> = (props: UserProps) => {
  const { id, name, canEdit } = props;
  const idName = React.useMemo<Data.IdName>(() => {
    return { id, name };
  }, [id, name]);

  const { api, cache } = useApi();
  const fetching: FetchingT<Data.User, void> = useFetchApi2(api.getUser, idName, cache.getUser);
  const showData: ShowDataT<Data.User, void> = (fetched: FetchedT<Data.User, void>) =>
    Page.showUserSettings(fetched, { canEdit });

  return getPage(fetching, showData);
};

type UserActivityProps = { options: Url.UserActivityOptions } & UserCanEdit;
export const UserActivity: React.FunctionComponent<UserActivityProps> = (props: UserActivityProps) => {
  // UserActivity may have extra search options, same as for Discussions, which the profile tab doesn't have
  const { user, userTabType, sort, page } = props.options;
  const { canEdit } = props;
  const { id, name } = user;
  const options = React.useMemo<Url.UserActivityOptions>(() => {
    return { user: { id, name }, userTabType, sort, page };
  }, [id, name, userTabType, sort, page]);

  const { api, cache } = useApi();
  const fetching: FetchingT<Data.UserActivity, void> = useFetchApi2(
    api.getUserActivity,
    options,
    cache.getUserActivity
  );
  const showData: ShowDataT<Data.UserActivity, void> = (fetched: FetchedT<Data.UserActivity, void>) =>
    Page.showUserActivity(fetched, { canEdit });

  return getPage(fetching, showData);
};

export const Image: React.FunctionComponent<Data.IdName> = (props: Data.IdName) => {
  // ImageId is a separate function component because there's an `if` statement at the top of the Image cmpnent
  // https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect

  const { id, name } = props;
  const idName = React.useMemo<Data.IdName>(() => {
    return { id, name };
  }, [id, name]);

  const { api, cache } = useApi();
  return getPage(useFetchApi2(api.getImage, idName, cache.getImage), Page.showImage);
};

export const Discussion: React.FunctionComponent<Url.DiscussionOptions> = (props: Url.DiscussionOptions) => {
  const { sort, discussion, page } = props;
  const options: Url.DiscussionOptions = React.useMemo(() => {
    return {
      sort,
      page,
      discussion: { id: discussion.id, name: discussion.name },
    };
  }, [sort, discussion.id, discussion.name, page]);
  const { api, cache } = useApi();
  return getPage(useFetchApi2(api.getDiscussion, options, cache.getDiscussion), Page.showDiscussion);
};

type TagIdProps = Url.InfoOrEdit & { tag: string };
export const Tag: React.FunctionComponent<TagIdProps> = (props: TagIdProps) => {
  const { tag, word } = props;

  // include word as a dependency because we want to re-render if word changes,
  // even though { word } isn't required in the TParam parameter passed to useGetLayout2
  const key: Data.Key & Url.InfoOrEdit = React.useMemo(() => {
    return { key: tag, word };
  }, [tag, word]);

  const showData: ShowDataT<Data.TagInfo, void> = (fetched: FetchedT<Data.TagInfo, void>) =>
    Page.showTag(fetched, { word });
  const { api, cache } = useApi();
  return getPage(useFetchApi2(api.getTag, key, cache.getTag), showData);
};
