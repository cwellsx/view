import React from 'react';
import { NavLink } from 'react-router-dom';
import * as I from "../data";
import { Content } from './Column';
import { getPageUrl } from "../io/pageId";

export function getImageSummary(summary: I.ImageSummary): Content {
  const href = getPageUrl({ pageType: "Image", id: summary.idName });
  const element: React.ReactElement = (
    <React.Fragment>
      <h3><NavLink to={href}>{summary.idName.name}</NavLink></h3>
      <p>{summary.summary}</p>
    </React.Fragment>
  );
  return { element, key: href };
}

export function getUserName(idName: I.IdName): React.ReactElement {
  const href = getPageUrl({ pageType: "User", id: idName });
  return <NavLink to={href}>{idName.name}</NavLink>;
}

export function getUserSmallGravatar(summary: I.UserSummary, title: boolean = true): React.ReactElement {
  const href = getPageUrl({ pageType: "User", id: summary.idName });
  // https://en.gravatar.com/site/implement/images/
  const src = `https://www.gravatar.com/avatar/${summary.gravatarHash}?s=48&d=identicon&r=PG`;
  return <NavLink to={href} title={title ? summary.idName.name : undefined}><img src={src} className="gravatar-small" alt={summary.idName.name} width="24" height="24" /></NavLink>;
}

const nbsp = "\u00A0";

export function getFeatureSummary(summary: I.FeatureSummary): Content {
  const href = getPageUrl({ pageType: "Feature", id: summary.idName });
  const label = summary.idName.name.replace(" ", nbsp)
  const element = <NavLink to={href}>{label}</NavLink>;
  return { element, key: href };
}
