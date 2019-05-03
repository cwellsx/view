import React, { ReactElement } from 'react';
import * as I from "../data";
import { Content } from './Column';
import * as Links from './Links';

export function getImageSummary(x: I.ImageSummary): Content {
  const element: ReactElement = (
    <React.Fragment>
      <h3>{Links.image(x.idName)}</h3>
      <p>{x.summary}</p>
    </React.Fragment>
  );
  const key = `/images/${x.idName.id}`;
  return { element, key };
}