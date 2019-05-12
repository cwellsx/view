import React from 'react';
import { NavLink } from 'react-router-dom';
import * as I from "../data";
import { KeyedItem } from './PageLayout';
import { getPageUrl } from "../io/pageId";

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

export function getUserSummary(summary: I.UserSummary, option: { title: boolean, size: "small" | "big" | "huge" })
  : { userName: React.ReactElement, gravatar: React.ReactElement, key: string } {
  const href = getPageUrl({ pageType: "User", id: summary.idName });
  const userName = <NavLink to={href}>{summary.idName.name}</NavLink>;
  const size = (option.size === "small") ? 24 : (option.size === "big") ? 48 : 164;
  // https://en.gravatar.com/site/implement/images/
  const src = `https://www.gravatar.com/avatar/${summary.gravatarHash}?s=${size * 2}&d=identicon&r=PG`;
  const img = <img src={src} alt={summary.idName.name} width={size} height={size} />;
  const gravatar = <NavLink to={href} title={option.title ? summary.idName.name : undefined} className="gravatar">{img}</NavLink>;
  return { userName, gravatar, key: href };
}

const nbsp = "\u00A0";

export function getFeatureSummary(summary: I.FeatureSummary): KeyedItem {
  const href = getPageUrl({ pageType: "Feature", id: summary.idName });
  const label = summary.idName.name.replace(" ", nbsp)
  const element = <NavLink to={href}>{label}</NavLink>;
  return { element, key: href };
}
