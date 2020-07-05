import { Data, Url } from 'client/src';
import React from 'react';

import { getFirstMessage, getNextMessage, getPageNavLinks } from '../components';
import { AnswerDiscussion } from '../forms';
import { FetchedT, KeyedItem, Layout, SubTabs } from '../layouts';

export function showDiscussion(fetched: FetchedT<Data.Discussion, void>): Layout {
  const { data, reload } = fetched;
  const { id, name, tags, first, range, messages } = data;
  const { nTotal } = range;

  const subTabs: SubTabs | undefined = !nTotal
    ? undefined
    : {
        text: nTotal === 1 ? "1 Answer" : `${nTotal} Answers`,
        selected: data.range.sort === "Newest" ? 0 : 1,
        tabs: [
          {
            text: "newest",
            href: Url.getDiscussionOptionsUrl({
              discussion: data,
              sort: "Newest",
            }),
          },
          {
            text: "oldest",
            href: Url.getDiscussionOptionsUrl({
              discussion: data,
              sort: "Oldest",
            }),
          },
        ],
      };

  const content: KeyedItem[] = [];
  content.push(getFirstMessage(first, tags));
  messages.forEach((message, index) => content.push(getNextMessage(message, index)));

  const footer =
    range.nTotal > range.pageSize ? (
      <div className="footer">
        <div className="index">
          {getPageNavLinks(range.pageNumber, range.nTotal, range.pageSize, (page) =>
            Url.getDiscussionOptionsUrl({
              discussion: data,
              page,
              sort: range.sort,
            })
          )}
        </div>
      </div>
    ) : undefined;

  const yourAnswer = <AnswerDiscussion discussionId={id} reload={reload} />;
  content.push({ element: yourAnswer, key: "editor" });

  return {
    main: { content, title: name, subTabs, footer },
    width: "Open",
  };
}
