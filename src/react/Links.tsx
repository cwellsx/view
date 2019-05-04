import React from 'react';
import { NavLink } from 'react-router-dom';
import * as I from "../data";

// from https://github.com/valeriangalliat/markdown-it-anchor/blob/master/index.js
const slugify = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-'))

function makeHref(root: string, idName: I.IdName): string {
  const slug = slugify(idName.name);
  return `${root}/${idName.id}/${slug}`;
}

export function image(id: I.IdName): React.ReactElement {
  const href = makeHref("/images", id);
  return <NavLink to={href}>{id.name}</NavLink>;
}