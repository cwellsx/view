import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { Api, Url, Data, toHtml, config } from "client";
import { useFetchApi2, FetchingT, useMe } from "../hooks";
import { getPage, FetchedT, ShowDataT, Layout, KeyedItem, Tab, Tabs, SubTabs, MainContent } from "../layouts";
import { notFound } from "./NotFound";
import { History } from "history";
import { EditUserSettings } from "../Editor";
import { getUserSummary, getTagCount, getDiscussionSummary } from "../components";
import * as Icon from "../icons";

export const User: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const parsed = Url.isUserOptions(props.location);
  const me = useMe();
  if (Url.isParserError(parsed)) {
    return notFound(props, parsed.error);
  }
  const { userTabType, user } = parsed;
  const canEdit = !!me && user.id === me.id;
  switch (userTabType) {
    case "Profile":
    case undefined:
      return <UserProfile {...props} id={user.id} name={user.name} canEdit={canEdit} />;
    case "EditSettings":
      if (!canEdit) {
        return notFound(props, "You cannot edit another user's profile");
      }
      return <UserEditSettings {...props} id={user.id} name={user.name} canEdit={canEdit} />;
    case "Activity":
      const options = Url.isUserActivityOptions(props.location);
      if (Url.isParserError(options)) {
        return notFound(props, options.error);
      }
      return <UserActivity {...props} options={options} canEdit={canEdit} />;
    default:
      return notFound(props, "Unexpected userTabType");
  }
};

// these are used as TExtra types
type UserCanEdit = { canEdit: boolean };
type UserCanEditAndHistory = UserCanEdit & { history: History };

type UserProps = RouteComponentProps & Data.IdName & UserCanEdit;
const UserProfile: React.FunctionComponent<UserProps> = (props: UserProps) => {
  const { id, name, canEdit } = props;
  const idName = React.useMemo<Data.IdName>(() => {
    return { id, name };
  }, [id, name]);

  const fetching: FetchingT<Data.User, void> = useFetchApi2(Api.getUser, idName);
  const showData: ShowDataT<Data.User, void> = (fetched: FetchedT<Data.User, void>) =>
    showUserProfile(fetched, { canEdit });

  return getPage(fetching, showData);
};

const UserEditSettings: React.FunctionComponent<UserProps> = (props: UserProps) => {
  const { id, name, canEdit, history } = props;
  const idName = React.useMemo<Data.IdName>(() => {
    return { id, name };
  }, [id, name]);

  const fetching: FetchingT<Data.User, void> = useFetchApi2(Api.getUser, idName);
  const showData: ShowDataT<Data.User, void> = (fetched: FetchedT<Data.User, void>) =>
    showUserSettings(fetched, { canEdit, history });

  return getPage(fetching, showData);
  // return useGetLayout2<Data.User, Data.IdName, UserCanEditAndHistory>(Api.getUser, Page.UserSettings, idName, {
  //   canEdit: props.canEdit,
  //   history: props.history,
  // });
};

type UserActivityProps = RouteComponentProps & {
  options: Url.UserActivityOptions;
} & UserCanEdit;
const UserActivity: React.FunctionComponent<UserActivityProps> = (props: UserActivityProps) => {
  // UserActivity may have extra search options, same as for Discussions, which the profile tab doesn't have
  const { user, userTabType, sort, page } = props.options;
  const { canEdit } = props;
  const { id, name } = user;
  const options = React.useMemo<Url.UserActivityOptions>(() => {
    return { user: { id, name }, userTabType, sort, page };
  }, [id, name, userTabType, sort, page]);

  const fetching: FetchingT<Data.UserActivity, void> = useFetchApi2(Api.getUserActivity, options);
  const showData: ShowDataT<Data.UserActivity, void> = (fetched: FetchedT<Data.UserActivity, void>) =>
    showUserActivity(fetched, { canEdit });

  return getPage(fetching, showData);
};

export function showUserProfile(fetched: FetchedT<Data.User, void>, extra: { canEdit: boolean }): Layout {
  const { data: user } = fetched;
  const gravatar = getUserSummary(user, {
    title: false,
    size: "huge",
  }).gravatar;
  const { aboutMe, location } = user;
  const aboutMeDiv = !aboutMe ? undefined : <div dangerouslySetInnerHTML={toHtml(aboutMe)} />;
  const content = (
    <div className="user-profile profile">
      {gravatar}
      <div className="column">
        <h1>{user.name}</h1>
        {location ? (
          <p className="location">
            <Icon.Location width="24" height="24" /> {location}
          </p>
        ) : undefined}
        <div className="about">
          <h3>About me</h3>
          {aboutMeDiv}
        </div>
      </div>
    </div>
  );
  return showCommonUserLayout(user, "Profile", content, extra.canEdit);
}

export function showUserSettings(
  fetched: FetchedT<Data.User, void>,
  extra: { canEdit: boolean; history: History }
): Layout {
  const { data: user } = fetched;
  const gravatar = getUserSummary(user, {
    title: false,
    size: "huge",
  }).gravatar;
  // EditUserSettings is a separate function component instead of just being incide the getSettingsContent function
  // [because it contains hooks](https://reactjs.org/docs/hooks-rules.html#only-call-hooks-from-react-functions)
  const content = (
    <div className="user-profile settings">
      <EditUserSettings
        history={extra.history}
        name={user.name}
        location={user.location}
        aboutMe={user.aboutMe}
        email={user.preferences!.email}
        userId={user.id}
        gravatar={gravatar}
      />
    </div>
  );
  return showCommonUserLayout(user, "EditSettings", content, extra.canEdit);
}

export function showUserActivity(fetched: FetchedT<Data.UserActivity, void>, extra: { canEdit: boolean }): Layout {
  const { data: activity } = fetched;
  function getActivityContent(): ReadonlyArray<KeyedItem> {
    if (!activity.summaries.length) {
      return [{ element: <p>This user has not posted any messages.</p>, key: "none" }];
    }
    const tagCounts = activity.tagCounts.sort((x, y) => x.key.localeCompare(y.key));
    const tags = (
      <React.Fragment>
        <h2>{`${activity.tagCounts.length} ${config.strTags}`}</h2>
        <div className="tags">{tagCounts.map(getTagCount)}</div>
      </React.Fragment>
    );
    const first: KeyedItem = { element: tags, key: "tags" };
    const next: KeyedItem[] = activity.summaries.map((summary) => getDiscussionSummary(summary, true));
    return [first].concat(next);
  }
  const content = getActivityContent();

  function getActivityUrl(user: Data.IdName, sort: Url.ActivitySort) {
    return Url.getUserActivityUrl({ user, userTabType: "Activity", sort });
  }
  const subTabs: SubTabs = {
    text: activity.summaries.length === 1 ? "1 Message" : `${activity.summaries.length} Messages`,
    selected: activity.range.sort === "Newest" ? 0 : 1,
    tabs: [
      { text: "newest", href: getActivityUrl(activity.summary, "Newest") },
      { text: "oldest", href: getActivityUrl(activity.summary, "Oldest") },
    ],
  };

  return showCommonUserLayout(activity.summary, "Activity", content, extra.canEdit, subTabs);
}

// create a Layout that's common to all three user tabs
function showCommonUserLayout(
  summary: Data.UserSummary,
  userTabType: Url.UserTabType,
  content: MainContent,
  canEdit: boolean,
  subTabs?: SubTabs
): Layout {
  const gravatarSmall = getUserSummary(summary, {
    title: false,
    size: "small",
  }).gravatar;
  const slug = (
    <React.Fragment>
      <h1>{summary.name}</h1>
      {gravatarSmall}
    </React.Fragment>
  );

  // the tab definitions

  const profile: Tab = {
    navlink: {
      href: Url.getUserOptionsUrl({ user: summary, userTabType: "Profile" }),
      text: "Profile",
    },
    content: <p>To be supplied</p>,
  };

  const settings: Tab = {
    navlink: {
      href: Url.getUserOptionsUrl({ user: summary, userTabType: "EditSettings" }),
      text: "Edit",
    },
    content: <p>Not authorized</p>,
    slug,
  };

  const activity: Tab = {
    navlink: {
      href: Url.getUserOptionsUrl({ user: summary, userTabType: "Activity" }),
      text: "Activity",
    },
    content: <p>To be supplied</p>,
    subTabs,
    slug,
  };

  function getSelected(): number {
    switch (userTabType) {
      case "Profile":
        profile.content = content;
        return 0;
      case "EditSettings":
        if (canEdit) {
          settings.content = content;
        }
        return 1;
      case "Activity":
        activity.content = content;
        return canEdit ? 2 : 1;
      default:
        throw new Error("Unexpected userTabType");
    }
  }
  const selected = getSelected();

  const tabs: Tabs = {
    selected,
    title: summary.name,
    tabbed: canEdit ? [profile, settings!, activity] : [profile, activity],
  };

  return {
    main: tabs,
    width: "Closed",
  };
}
