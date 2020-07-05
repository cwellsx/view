import { config, Data, toHtml, Url } from 'client/src';
import React from 'react';

import { getDiscussionSummary, getTagCount, getUserSummary } from '../components';
import { EditUserSettings } from '../forms';
import * as Icon from '../icons';
import { FetchedT, KeyedItem, Layout, MainContent, SubTabs, Tab, Tabs } from '../layouts';

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

export function showUserSettings(fetched: FetchedT<Data.User, void>, extra: { canEdit: boolean }): Layout {
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
