import React from "react";
import { Link } from "react-router-dom";
import { Url, Data } from "client";

export function getTagLink(tag: Data.Key): React.ReactElement {
  const href = Url.getTagUrl(tag);
  return (
    <Link className="tag" to={href}>
      {tag.key}
    </Link>
  );
}
