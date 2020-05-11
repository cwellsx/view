import React from "react";
import { Data, toHtml } from "client";
import type { KeyedItem } from "../layouts";

import { getTags } from "./getTags";
import { toLocaleString } from "./toLocaleString";
import { getUserInfo } from "./getUserInfo";

function getMessage(message: Data.Message, index: number, tags?: Data.Key[]): KeyedItem {
  const topic = tags ? getTags(tags) : undefined; // only the first message in a discussion has associated tags
  const when = toLocaleString(new Date(message.dateTime));
  const element = (
    <React.Fragment>
      <div className="message">
        <div dangerouslySetInnerHTML={toHtml(message.markdown)} />
        {topic}
        {getUserInfo(message.userSummary, "small", when)}
      </div>
    </React.Fragment>
  );
  return { key: "" + index, element };
}

export function getFirstMessage(message: Data.Message, tags: Data.Key[]): KeyedItem {
  return getMessage(message, 0, tags);
}

export function getNextMessage(message: Data.Message, index: number): KeyedItem {
  return getMessage(message, index + 1);
}
