import React, { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import * as I from "../data";
import { KeyedItem } from './PageLayout';
import { getPageUrl } from "../io/pageId";
import './Components.css';

/*
  This module defines components which exist within larger content.
  https://reactjs.org/docs/components-and-props.html#extracting-components
  They're currently defined as functions, however.
*/

export function getImageSummary(summary: I.ImageSummary): KeyedItem {
  const href = getPageUrl({ pageType: "Image", id: summary.idName });
  const element: React.ReactElement = (
    <React.Fragment>
      <h3><NavLink to={href}>{summary.idName.name}</NavLink></h3>
      <p>{summary.summary}</p>
    </React.Fragment>
  );
  return { element, key: href };
}

type GravatarSize = "small" | "big" | "huge";

export function getUserSummary(summary: I.UserSummary, option: { title: boolean, size: GravatarSize })
  : { userName: React.ReactElement, gravatar: React.ReactElement, key: string } {
  const href = getPageUrl({ pageType: "User", id: summary.idName });
  const userName = <NavLink to={href}>{summary.idName.name}</NavLink>;
  const size = (option.size === "small") ? 32 : (option.size === "big") ? 48 : 164;
  // https://en.gravatar.com/site/implement/images/
  const src = `https://www.gravatar.com/avatar/${summary.gravatarHash}?s=${size * 2}&d=identicon&r=PG`;
  const img = <img src={src} alt={summary.idName.name} width={size} height={size} />;
  const gravatar = <NavLink to={href} title={option.title ? summary.idName.name : undefined} className="gravatar">{img}</NavLink>;
  return { userName, gravatar, key: href };
}

export function getUserInfo(summary: I.UserSummary, size: GravatarSize, when?: string): ReactElement {
  const { userName, gravatar, key } = getUserSummary(summary, { title: false, size });
  const showWhen = !when ? undefined : <div className="when">{when}</div>;
  return (
    <div className="user-info" key={key}>
      {showWhen}
      {gravatar}
      <div className="details">
        {userName}
        {summary.location ? <span className="user-location">{summary.location}</span> : undefined}
      </div>
    </div>
  );
}

const nbsp = "\u00A0";

export function getFeatureSummary(summary: I.FeatureSummary): KeyedItem {
  const href = getPageUrl({ pageType: "Feature", id: summary.idName });
  const label = summary.idName.name.replace(" ", nbsp)
  const element = <NavLink to={href}>{label}</NavLink>;
  return { element, key: href };
}

function toLocaleString(date: Date): string {
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  const year = (new Date().getFullYear() === date.getFullYear()) ? "" : ` '${("" + date.getFullYear()).substring(2)}`;
  const minutes = ("" + date.getMinutes()).padStart(2, "0");
  return `${month} ${date.getDate()}${year} at ${date.getHours()}:${minutes}`;
}

export function getDiscussionSummary(summary: I.DiscussionSummary): KeyedItem {
  const href = getPageUrl({ pageType: "Discussion", id: summary.idName });
  const when = toLocaleString(new Date(summary.messageSummary.dateTime));
  const topic = summary.topicSummary.idName.name;
  const element: React.ReactElement = (
    <div className="discussion-summary">
      <div className="stats">
        <div className="answers">
          <strong>{summary.nAnswers}</strong> {(summary.nAnswers === 1) ? "answer" : "answers"}
        </div>
      </div>
      <div className="summary">
        <h3><NavLink to={href}>{summary.idName.name}</NavLink></h3>
        <div className="excerpt">{summary.messageSummary.messageExerpt}</div>
        <div className="topic"><span>{topic}</span></div>
        {getUserInfo(summary.messageSummary.userSummary, "small", when)}
      </div>
    </div>
  );
  return { element, key: href };
}
