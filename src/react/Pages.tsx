import React from 'react';
import * as I from "../data";
import { KeyedItem, Layout, Tab, Tabs } from './PageLayout';
import * as Summaries from "./Components";
import { getUserUrl, UserTabType, getDiscussionsUrl, PageSize } from "../shared/request";
import './Pages.css';
import { ReactComponent as LocationIcon } from "../icons/material/ic_location_on_24px.svg";
import { config } from '../config';
import { NavLink } from 'react-router-dom';


/*
  While `App.tsx` defines "container" components, which manage routes and state,
  conversely this `Page.tsx` defines "presentational" components.
*/

/*
  SiteMap
*/

export function SiteMap(data: I.SiteMap): Layout {
  const contents: KeyedItem[] = [];

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
  data.images.forEach(x => contents.push(Summaries.getImageSummary(x)));

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

  contents.push({ element: features, key: "Feature" });

  return { main: contents };
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
  return <label><input type="checkbox" defaultChecked={true} onChange={handleLayerChange} name={alias} />{node.name}</label>
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
    main: images,
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
    main: users,
    width: "Grid"
  };
}

/*
  User
*/

interface UserProfileProps { data: I.User, userTabType: UserTabType };

function isUserProfile(props: UserProfileProps | I.UserActivity): props is UserProfileProps {
  return (props as UserProfileProps).userTabType !== undefined;
}

export function User(
  props: UserProfileProps | I.UserActivity,
  canEdit: boolean,
  userId: number): Layout {
  // crack the input parameters
  const summary = !isUserProfile(props) ? props.summary : props.data.summary;
  const userTabType: UserTabType = !isUserProfile(props) ? "Activity" : props.userTabType;

  // build the gravatars
  const { userName, gravatar } = Summaries.getUserSummary(summary, { title: false, size: "huge" });
  const gravatarSmall = Summaries.getUserSummary(summary, { title: false, size: "small" }).gravatar;
  const selected = canEdit
    ? ((userTabType === "Profile") ? 0 : (userTabType === "EditSettings") ? 1 : 2)
    : ((userTabType === "Profile") ? 0 : 1);
  const idName: I.IdName = summary.idName;

  const profile: Tab = {
    navlink: { href: getUserUrl(idName, "Profile"), text: "Profile" },
    content: (
      <div className="user-profile profile">
        {gravatar}
        <div className="column">
          <h1>{summary.idName.name}</h1>
          {summary.location ? <p className="location"><LocationIcon viewBox="0 0 24 24" width="18" height="18" /> {summary.location}</p> : undefined}
          <div className="about">
            <p>About me</p>
          </div>
        </div>
      </div>
    )
  };

  function getSettings(): Tab {

    function getSettingsContent() {
      if (!isUserProfile(props)) {
        return <p>To be supplied</p>;
      }
      const inputDisplayName = React.createRef<HTMLInputElement>();
      const inputEmail = React.createRef<HTMLInputElement>();
      const inputLocation = React.createRef<HTMLInputElement>();
      const inputAbout = React.createRef<HTMLInputElement>();
      const preferences: I.UserPreferences = props.data.preferences!;
      const profile: I.UserProfile = props.data.profile;

      return (
        <div className="user-profile settings">
          <h1>Edit</h1>
          <h2>Public information</h2>
          <div className="public">
            {gravatar}
            <div className="column">
              <label>Display name</label>
              <input type="text" ref={inputDisplayName} placeholder="required" defaultValue={summary.idName.name} />
              <label>Location (optional)</label>
              <input type="text" ref={inputLocation} placeholder="optional" defaultValue={summary.location} />
            </div>
          </div>
          <label>About me</label>
          <input type="text" ref={inputAbout} placeholder="required" defaultValue={profile.aboutMe} />
          <h2>Private settings</h2>
          <label>Email</label>
          <input type="text" ref={inputEmail} placeholder="required" defaultValue={preferences.email} />
        </div>
      );
    }

    const rc: Tab = {
      navlink: { href: getUserUrl(idName, "EditSettings"), text: "Edit" },
      content: getSettingsContent()
    };
    return rc;
  }
  const settings: Tab | undefined = canEdit ? getSettings() : undefined;

  const activity: Tab = {
    navlink: { href: getUserUrl(idName, "Activity"), text: "Activity" },
    content: <p>Where</p>
  };
  const header = {
    first: (
      <React.Fragment>
        {gravatar}
        <h1>{userName}</h1>
      </React.Fragment>
    ),
    next: (
      <React.Fragment>
        <h1>{userName}</h1>
        {gravatarSmall}
      </React.Fragment>
    )
  };
  const tabs: Tabs = {
    style: "Profile",
    header,
    selected,
    tabbed: canEdit ? [profile, settings!, activity] : [profile, activity]
  };
  return {
    main: tabs
  };
}

/*
  Discussions
*/

export function Discussions(data: I.Discussions): Layout {
  const { meta, summaries } = data;

  // https://blog.abelotech.com/posts/number-currency-formatting-javascript/
  const numQuestions = meta.nTotal.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + " " + config.strQuestions.toLowerCase();

  const subtitle = (
    <React.Fragment>
      <div className="subtitle">
        <div className="count">{numQuestions}</div>
        <div className="sort">
          <NavLink to={getDiscussionsUrl({ sort: "Newest" })}
            className={meta.sort === "Newest" ? "selected" : undefined}>Newest</NavLink>
          <NavLink to={getDiscussionsUrl({ sort: "Active" })}
            className={meta.sort === "Active" ? "selected" : undefined}>Active</NavLink>
        </div>
      </div>
    </React.Fragment>
  );

  const nPages = Math.floor(meta.nTotal / meta.pageSize) + ((meta.nTotal % meta.pageSize) ? 1 : 0);
  const sort = meta.sort;
  const footer = (
    <React.Fragment>
      <div className="footer">
        <div className="index">
          {Summaries.getPageNavLinks(meta.pageNumber, nPages, (page) => getDiscussionsUrl({ page, sort }))}
        </div>
        <div className="size">
          {Summaries.getNavLinks(
            [15, 30, 50].map(n => { return { text: "" + n, n }; }),
            (n: number) => getDiscussionsUrl({ pagesize: n as PageSize }),
            (n: number) => `show ${n} items per page`,
            meta.pageSize,
            false
          )}
          <span className="dots">per page</span>
        </div>
      </div>
    </React.Fragment>
  );

  const elements = summaries.map(summary => Summaries.getDiscussionSummary(summary));
  elements.push({ element: footer, key: "footer" });
  return {
    main: elements,
    subtitle
  };
}