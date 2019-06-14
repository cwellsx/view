import React from 'react';
import * as I from "../data";
import { KeyedItem, Layout, Tab, Tabs, SubTabs, MainContent } from './PageLayout';
import * as Summaries from "./Components";
import * as R from "../shared/urls";
import './Pages.css';
import * as Icon from "../icons";
import { config } from '../config';
import { NavLink, Link } from 'react-router-dom';
import { AnswerDiscussion, EditUserSettings } from "./Editor";
import { toHtml } from "../io/markdownToHtml";
import { History } from "history";

/*
  While `App.tsx` defines "container" components, which manage routes and state,
  conversely this `Page.tsx` defines "presentational" components.
*/

/*
  SiteMap
*/

export function SiteMap(data: I.SiteMap): Layout {
  const content: KeyedItem[] = [];

  /*
    visitors can see:
    - image document[s]
    - (featured) articles
    - (text) sources

    and cannot see:
    - users
    - discussions
    - feaure reports
    - notable omissions
  */

  // render the images
  data.images.forEach(x => content.push(Summaries.getImageSummary(x)));

  const features = (
    <React.Fragment>
      <h2>Features</h2>
      <div className="features">
        {data.tags.map(tag => {
          const content = Summaries.getTagSummary(tag);
          /*
            either we need to add whitespace between elements ...
            - https://github.com/facebook/react/issues/1643
            - https://reactjs.org/blog/2014/02/20/react-v0.9.html#jsx-whitespace
            ... or to add whitespace between spans ...
            - https://github.com/facebook/react/issues/1643#issuecomment-321439506
          */
          return (
            <span key={content.key}>
              {content.element}
            </span>
          );
        })}
      </div>
    </React.Fragment>
  );

  content.push({ element: features, key: "Feature" });

  return { main: { title: "Site Map", content }, width: "Closed" };
}

/*
  Image
*/

function getLayerKey(layer: I.LayerNode): string {
  return (layer.alias)
    ? layer.alias
    : layer.name.toLowerCase().replace("&", "and").replace(" ", "-");
}

function handleLayerChange(event: React.ChangeEvent<HTMLInputElement>) {
  const target = event.target;
  const alias: string | null = target.getAttribute("name");
  const checked: boolean = target.checked;
  alert(`In the non-prototype this would ${(checked) ? "show" : "hide"} the '${alias}' image layer`);
}

function renderNode(node: I.LayerNode, alias: string): React.ReactElement {
  // https://stackoverflow.com/questions/26615779/react-checkbox-not-sending-onchange
  return <label><input type="checkbox" defaultChecked={true} onChange={handleLayerChange} name={alias} />
    {node.name}
  </label>
}

function renderLayers(layers: I.ImageLayers, level: number): React.ReactElement {
  const className = (level === 0) ? "image-layers" : undefined;
  const listItems = layers.map((node) => {
    const alias = getLayerKey(node);
    return (
      <li key={alias} className={node.children ? "parent" : undefined}>
        {renderNode(node, alias)}
        {node.children && renderLayers(node.children, level + 1)}
      </li>
    );
  });
  return (
    <ul className={className}>
      {listItems}
    </ul>
  )
}

export function Image(data: I.Image): Layout {
  const images =
    <div className="image-images">
      <img src={data.image.src} height={data.image.height} width={data.image.width} alt="" />
    </div>;
  const right = !data.layers ? undefined :
    { element: renderLayers(data.layers, 0), width: data.layersWidth, showButtonLabel: "Show Layers", visible: true };
  return {
    main: { content: images, title: data.name },
    width: "Full",
    right
  };
}

/*
  Users
*/

export function Users(data: I.UserSummaryEx[]): Layout {
  const users: React.ReactElement =
    <div className="all-users">
      {data.map(user => {
        return Summaries.getUserInfo(user, "big");
      })}
    </div>;
  return {
    main: { content: users, title: "Users" },
    width: "Grid"
  };
}

/*
  User
*/

export function UserProfile(user: I.User, extra: { canEdit: boolean }): Layout {
  const gravatar = Summaries.getUserSummary(user, { title: false, size: "huge" }).gravatar;
  const { aboutMe, location } = user;
  const aboutMeDiv = !aboutMe ? undefined : <div dangerouslySetInnerHTML={toHtml(aboutMe)} />;
  const content = (
    <div className="user-profile profile">
      {gravatar}
      <div className="column">
        <h1>{user.name}</h1>
        {location ? <p className="location"><Icon.Location width="24" height="24" /> {location}</p> : undefined}
        <div className="about">
          <h3>About me</h3>
          {aboutMeDiv}
        </div>
      </div>
    </div>
  );
  return useCommonUserLayout(user, "Profile", content, extra.canEdit);
}

export function UserSettings(user: I.User, extra: { canEdit: boolean, history: History }): Layout {
  const gravatar = Summaries.getUserSummary(user, { title: false, size: "huge" }).gravatar;
  // EditUserSettings is a separate function component instead of just being incide the getSettingsContent function 
  // [because it contains hooks](https://reactjs.org/docs/hooks-rules.html#only-call-hooks-from-react-functions)
  const content = (
    <div className="user-profile settings">
      <EditUserSettings history={extra.history} name={user.name} location={user.location} aboutMe={user.aboutMe}
        email={user.preferences!.email} userId={user.id} gravatar={gravatar} />
    </div>
  );
  return useCommonUserLayout(user, "EditSettings", content, extra.canEdit);
}


export function UserActivity(activity: I.UserActivity, extra: { canEdit: boolean }): Layout {
  function getActivityContent(): ReadonlyArray<KeyedItem> {
    if (!activity.summaries.length) {
      return [{ element: <p>This user has not posted any messages.</p>, key: "none" }];
    }
    const tagCounts = activity.tagCounts.sort((x, y) => x.key.localeCompare(y.key));
    const tags = (
      <React.Fragment>
        <h2>{`${activity.tagCounts.length} ${config.strTags}`}</h2>
        <div className="tags">
          {tagCounts.map(Summaries.getTagCount)}
        </div>
      </React.Fragment>
    );
    const first: KeyedItem = { element: tags, key: "tags" };
    const next: KeyedItem[] = activity.summaries.map(summary => Summaries.getDiscussionSummary(summary, true));
    return [first].concat(next);
  }
  const content = getActivityContent();

  function getActivityUrl(user: I.IdName, sort: R.ActivitySort) {
    return R.getUserActivityUrl({ user, userTabType: "Activity", sort })
  }
  const subTabs: SubTabs = {
    text: (activity.summaries.length === 1) ? "1 Message" : `${activity.summaries.length} Messages`,
    selected: (activity.range.sort === "Newest") ? 0 : 1,
    tabs: [
      { text: "newest", href: getActivityUrl(activity.summary, "Newest") },
      { text: "oldest", href: getActivityUrl(activity.summary, "Oldest") }
    ]
  };

  return useCommonUserLayout(activity.summary, "Activity", content, extra.canEdit, subTabs);
}

// create a Layout that's common to all three user tabs
function useCommonUserLayout(summary: I.UserSummary, userTabType: R.UserTabType, content: MainContent, canEdit: boolean,
  subTabs?: SubTabs): Layout {

  const gravatarSmall = Summaries.getUserSummary(summary, { title: false, size: "small" }).gravatar;
  const slug = (
    <React.Fragment>
      <h1>{summary.name}</h1>
      {gravatarSmall}
    </React.Fragment>
  );

  // the tab definitions

  const profile: Tab = {
    navlink: { href: R.getUserOptionsUrl({ user: summary, userTabType: "Profile" }), text: "Profile" },
    content: <p>To be supplied</p>
  };

  const settings: Tab = {
    navlink: { href: R.getUserOptionsUrl({ user: summary, userTabType: "EditSettings" }), text: "Edit" },
    content: <p>Not authorized</p>,
    slug
  };

  const activity: Tab = {
    navlink: { href: R.getUserOptionsUrl({ user: summary, userTabType: "Activity" }), text: "Activity" },
    content: <p>To be supplied</p>,
    subTabs,
    slug
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
        return (canEdit) ? 2 : 1;
      default:
        throw new Error("Unexpected userTabType");
    }
  }
  const selected = getSelected();

  const tabs: Tabs = {
    selected,
    title: summary.name,
    tabbed: canEdit ? [profile, settings!, activity] : [profile, activity]
  };

  return {
    main: tabs, width: "Closed"
  };
}

/*
  Discussions
*/

function formatNumber(count: number, things: string) {
  // https://blog.abelotech.com/posts/number-currency-formatting-javascript/
  const rc = count.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + " " + things.toLowerCase();
  return ((count === 1) && (things[things.length - 1] === "s")) ? rc.substring(0, rc.length - 1) : rc;
}

export function Discussions(data: I.Discussions): Layout {
  const { range, summaries } = data;
  const title = "All " + config.strQuestions;

  const subtitle = (
    <React.Fragment>
      <div className="minigrid">
        <h1>{title}</h1>
        <div className="link">
          <Link to={R.route.newDiscussion} className="linkbutton">{config.strNewQuestion.button}</Link>
        </div>
      </div>
      <div className="minigrid subtitle">
        <div className="count">{formatNumber(range.nTotal, config.strQuestions)}</div>
        <div className="sort">
          <NavLink to={R.getDiscussionsOptionsUrl({ sort: "Newest" })}
            className={range.sort === "Newest" ? "selected" : undefined}>Newest</NavLink>
          <NavLink to={R.getDiscussionsOptionsUrl({ sort: "Active" })}
            className={range.sort === "Active" ? "selected" : undefined}>Active</NavLink>
        </div>
      </div>
    </React.Fragment>
  );

  const sort = range.sort;
  const footer = (
    <React.Fragment>
      <div className="minigrid footer">
        <div className="page">
          {Summaries.getPageNavLinks(range.pageNumber, range.nTotal, range.pageSize,
            (page) => R.getDiscussionsOptionsUrl({ page, sort }))}
        </div>
        <div className="page">
          {Summaries.getNavLinks(
            [15, 30, 50].map(n => { return { text: "" + n, n }; }),
            (n: number) => R.getDiscussionsOptionsUrl({ pagesize: n as R.PageSize }),
            (n: number) => `show ${n} items per page`,
            range.pageSize,
            false
          )}
          <span className="dots">per page</span>
        </div>
      </div>
    </React.Fragment>
  );

  const content = summaries.map(summary => Summaries.getDiscussionSummary(summary));

  return {
    main: { content, title, subtitle, footer },
    width: "Closed"
  };
}

/*
  Discussion
*/

export function Discussion(data: I.Discussion, extra: { reload: () => void }): Layout {
  const { id, name, tags, first, range, messages } = data;
  const { nTotal } = range;

  const subTabs: SubTabs | undefined = (!nTotal) ? undefined : {
    text: (nTotal === 1) ? "1 Answer" : `${nTotal} Answers`,
    selected: (data.range.sort === "Newest") ? 0 : 1,
    tabs: [
      { text: "newest", href: R.getDiscussionOptionsUrl({ discussion: data, sort: "Newest" }) },
      { text: "oldest", href: R.getDiscussionOptionsUrl({ discussion: data, sort: "Oldest" }) }
    ]
  };

  const content: KeyedItem[] = [];
  content.push(Summaries.getFirstMessage(first, tags));
  messages.forEach((message, index) => content.push(Summaries.getNextMessage(message, index)));

  const footer = (range.nTotal > range.pageSize) ? (
    <div className="footer">
      <div className="index">
        {Summaries.getPageNavLinks(range.pageNumber, range.nTotal, range.pageSize,
          (page) => R.getDiscussionOptionsUrl({ discussion: data, page, sort: range.sort }))}
      </div>
    </div>
  ) : undefined;

  const yourAnswer = <AnswerDiscussion discussionId={id} reload={extra.reload} />;
  content.push({ element: yourAnswer, key: "editor" });

  return {
    main: { content, title: name, subTabs, footer },
    width: "Open"
  };
}

/*
  Tags
*/

export function Tags(data: I.Tags): Layout {
  const { range, tagCounts } = data;
  const title = config.strTags;

  // the header (subtitle) and footer are like (copy-and-pasted) those from the Discussions page

  const subtitle = (
    <React.Fragment>
      <div className="minigrid">
        <h1>{title}</h1>
      </div>
      <div className="minigrid subtitle">
        <div className="count">{"(filter by tag name)"}</div>
        <div className="sort">
          <NavLink to={R.getTagsOptionsUrl({ sort: "Popular" })}
            className={range.sort === "Popular" ? "selected" : undefined}>Popular</NavLink>
          <NavLink to={R.getTagsOptionsUrl({ sort: "Name" })}
            className={range.sort === "Name" ? "selected" : undefined}>Name</NavLink>
        </div>
      </div>
    </React.Fragment>
  );

  const footer = (
    <React.Fragment>
      <div className="minigrid footer">
      <div className="page"></div>
        <div className="page">
          {Summaries.getPageNavLinks(range.pageNumber, range.nTotal, range.pageSize,
            (page) => R.getTagsOptionsUrl({ page, sort: range.sort }))}
        </div>
      </div>
    </React.Fragment>
  );

  function getTagInfo(tagCount: I.TagCount) {
    // similar to the ShowHint function in EditorTags.tsx
    const key = tagCount.key;
    const href = R.getTagDiscussionsUrl({ key });
    const tag = <Link className="tag" to={href}>{key}</Link>;
    const count = (tagCount.count) ? <span className="multiplier">×&nbsp;{tagCount.count}</span> : undefined;
    const summary = (tagCount.summary) ? <div className="exerpt">{tagCount.summary}</div> : undefined;
    const edit = (
      <div>
        <Link className="edit-link" to={R.getTagEditUrl({ key })}>edit</Link>
      </div>
    );

    return (
      <div className="tag-info" key={key}>
        {tag}
        {count}
        {summary}
        {edit}
      </div>
    );
  }

  // the content is like that of the User page
  const contentTags: React.ReactElement = (
    <div className="all-tags">
      {tagCounts.map(tagCount => {
        return getTagInfo(tagCount);
      })
      }
    </div >
  );

  return {
    main: { content: contentTags, title, subtitle, footer },
    width: "Grid"
  };
}