import { Data, Url } from "client";
import React from "react";
import { Link } from "react-router-dom";

export function getTagLink(tag: Data.Key): React.ReactElement {
  const href = Url.getTagUrl(tag);
  return (
    <Link className="tag" to={href}>
      {tag.key}
    </Link>
  );
}
