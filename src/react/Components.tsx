import React, { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import * as I from "../data";
import { KeyedItem } from './PageLayout';
import { getResourceUrl } from "../shared/request";
import './Components.css';

/*
  This module defines components which exist within larger content.
  https://reactjs.org/docs/components-and-props.html#extracting-components
  They're currently defined as functions, however.
*/

export function getImageSummary(summary: I.ImageSummary): KeyedItem {
  const href = getResourceUrl({ resourceType: "Image", what: summary.idName });
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
  const href = getResourceUrl({ resourceType: "User", what: summary.idName });
  const userName = <NavLink to={href}>{summary.idName.name}</NavLink>;
  const size = (option.size === "small") ? 32 : (option.size === "big") ? 48 : 164;
  // https://en.gravatar.com/site/implement/images/
  const src = `https://www.gravatar.com/avatar/${summary.gravatarHash}?s=${size * 2}&d=identicon&r=PG`;
  const img = <img src={src} alt={summary.idName.name} width={size} height={size} />;
  const title = option.title ? summary.idName.name : undefined;
  const gravatar = <NavLink to={href} title={title} className="gravatar">{img}</NavLink>;
  return { userName, gravatar, key: href };
}

function getWhen(when: string) {
  return <div className="when">{when}</div>;
}

export function getUserInfo(summary: I.UserSummary, size: GravatarSize, when?: string): ReactElement {
  const { userName, gravatar, key } = getUserSummary(summary, { title: false, size });
  const showWhen = !when ? undefined : getWhen(when);
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

export function getTagSummary(summary: I.TagSummary): KeyedItem {
  const href = getResourceUrl({ resourceType: "Feature", what: { key: summary.key } });
  const label = summary.key.replace(" ", nbsp)
  const element = <NavLink to={href}>{label}</NavLink>;
  return { element, key: href };
}

function toLocaleString(date: Date): string {
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
  const year = (new Date().getFullYear() === date.getFullYear()) ? "" : ` '${("" + date.getFullYear()).substring(2)}`;
  const minutes = ("" + date.getMinutes()).padStart(2, "0");
  return `${month} ${date.getDate()}${year} at ${date.getHours()}:${minutes}`;
}

export function getTag(tag: I.TagId, count?: number) {
  const suffix = (count && (count !== 1)) ? ` x ${count}` : undefined;
  const text = I.getTagIdText(tag);
  return <div className="topic" key={text}><span>{text}</span>{suffix}</div>;
}

export function getDiscussionSummary(summary: I.DiscussionSummary, short: boolean = false): KeyedItem {
  const href = getResourceUrl({ resourceType: "Discussion", what: summary.idName });
  const when = toLocaleString(new Date(summary.messageSummary.dateTime));
  const tag = summary.tag;
  const stats = short ? undefined : (
    <div className="stats">
      <div className="answers">
        <strong>{summary.nAnswers}</strong> {(summary.nAnswers === 1) ? "answer" : "answers"}
      </div>
    </div>
  );
  const signature = short ? <div className="user-info">{getWhen(when)}</div> :
    getUserInfo(summary.messageSummary.userSummary, "small", when);
  const element: React.ReactElement = (
    <div className="discussion-summary">
      {stats}
      <div className="summary">
        <h3><NavLink to={href}>{summary.idName.name}</NavLink></h3>
        <div className="excerpt">{summary.messageSummary.messageExerpt}</div>
        {getTag(tag)}
        {signature}
      </div>
    </div>
  );
  return { element, key: href };
}

function getPageNumbers(current: number, max: number): Array<{ text: string, n: number } | undefined> {
  function numbers(first: number, last: number): Array<number | undefined> {
    // https://stackoverflow.com/questions/3746725/how-to-create-an-array-containing-1-n
    // says that convenient ways to do this are for higher versions of ES than supported in this project
    const rc: number[] = [];
    for (let i = first; i <= last; ++i) {
      rc.push(i);
    }
    return rc;
  }
  const wanted: Array<number | undefined> =
    (max <= 6)
      ? numbers(1, max)
      : ((current - 1) <= 3)
        ? numbers(1, 5).concat([undefined, max])
        : ((max - current) <= 3)
          ? [1, undefined].concat(numbers(max - 4, max))
          : [1, undefined].concat(numbers(current - 2, current + 2)).concat(undefined, max);
  const rc: Array<{ text: string, n: number } | undefined> = wanted.map(x => x ? { text: "" + x, n: x } : undefined);
  if (current > 1) {
    rc.unshift({ text: "prev", n: current - 1 });
  }
  if (current < max) {
    rc.push({ text: "next", n: current + 1 });
  }
  return rc;
}

export function getNavLinks(
  wanted: Array<{ text: string, n: number } | undefined>,
  href: (page: number) => string,
  title: (n: number) => string,
  current: number,
  spanifySelected: boolean): React.ReactElement[] {
  return wanted.map((x, index) => {
    if (!x) {
      const before: number = (wanted[index - 1] as { text: string, n: number }).n;
      return <span key={"dots-" + before} className="dots">…</span>;
    }
    const { text, n } = x;
    if (spanifySelected && (current === n)) {
      return <span className="selected" key={text} >{text}</span>;
    }
    const className = (current === n) ? "selected" : undefined;
    return <NavLink to={href(n)} key={text} title={title(n)} className={className}>{text}</NavLink >;
  });
}

export function getPageNavLinks(current: number, nTotal: number, pageSize: number, href: (page: number) => string)
  : React.ReactElement[] {
  const max = Math.floor(nTotal / pageSize) + ((nTotal % pageSize) ? 1 : 0);
  const wanted = getPageNumbers(current, max);
  return getNavLinks(wanted, href, n => "go to page " + n, current, true);
}

function getMessage(message: I.Message, index: number, tag?: I.TagId): KeyedItem {
  const topic = (!tag) ? undefined
    : <div className="topic"><span>{I.getTagIdText(tag)}</span></div>
  const when = toLocaleString(new Date(message.dateTime));
  const element = (
    <React.Fragment>
      <div className="message">
        <p>
          {message.markdown}
        </p>
        {topic}
        {getUserInfo(message.userSummary, "small", when)}
      </div>
    </React.Fragment>
  );
  return { key: "" + index, element };
}

export function getFirstMessage(message: I.Message, tag: I.TagId): KeyedItem {
  return getMessage(message, 0, tag);
}

export function getNextMessage(message: I.Message, index: number): KeyedItem {
  return getMessage(message, index + 1);
}
