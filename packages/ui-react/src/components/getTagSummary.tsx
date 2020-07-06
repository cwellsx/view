import { Data, Url } from 'client/src';
import React from 'react';

import { NavLink } from './Link';

import type { KeyedItem } from "../layouts";

const nbsp = "\u00A0";

export function getTagSummary(summary: Data.SiteTagCount): KeyedItem {
  const href = Url.getTagUrl(summary);
  const label = summary.title.replace(" ", nbsp);
  const element = <NavLink to={href}>{label}</NavLink>;
  return { element, key: href };
}
