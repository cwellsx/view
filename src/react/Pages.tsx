import React from 'react';
import * as I from "../data";
import { renderContentOne, Content, Contents } from './Column';
import * as Summaries from "./Summaries";

/*
  App.tsx defines "container" components, which manage routes and state.

  This Page.tsx defines "presentational" components.
*/

export type Present<T> = (data: T) => Contents;

export const SiteMap: Present<I.SiteMap> = (data: I.SiteMap) => {
  const contents: Content[] = [];

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

  return contents;
}
