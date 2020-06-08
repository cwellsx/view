import { Data } from "client/src";
import React from "react";
import { getTagLink } from "./getTagLink";

// called from getDiscussionSummary, and getMessage (for each message within discussion)
export function getTags(tags: Data.Key[]) {
  return (
    <div className="topic">
      {tags.map((tag) => {
        const link = getTagLink(tag);
        // want whitespace between each tag
        return <React.Fragment key={tag.key}>{link}&#32;</React.Fragment>;
      })}
    </div>
  );
}
