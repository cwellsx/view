import React from "react";
import { NavLink } from "react-router-dom";
import { Url, Data, toHtml } from "client";
import { KeyedItem } from "../PageLayout";

export function getImageSummary(summary: Data.ImageSummary): KeyedItem {
  const href = Url.getImageUrl(summary);
  const element: React.ReactElement = (
    <React.Fragment>
      <h3>
        <NavLink to={href}>{summary.name}</NavLink>
      </h3>
      <div dangerouslySetInnerHTML={toHtml(summary.summary)} />
    </React.Fragment>
  );
  return { element, key: href };
}
