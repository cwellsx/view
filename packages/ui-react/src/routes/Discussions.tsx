import { config, Data, Url } from 'client/src';
import React from 'react';

import { getDiscussionsSubtitle, getDiscussionSummary, getNavLinks, getPageNavLinks } from '../components';
import { FetchedT, Layout } from '../layouts';

export function showDiscussions(fetched: FetchedT<Data.Discussions, void>): Layout {
  const { data } = fetched;
  const { range, summaries } = data;
  const { pageNumber, nTotal, pageSize, sort, tag } = range;
  const title = !tag
    ? `All ${config.strQuestions}`
    : `${sort === "Newest" ? "Newest" : "Recently Active"} '${tag.key}' ${config.strQuestions}`;

  const subtitle = getDiscussionsSubtitle(title, formatNumber(nTotal, config.strQuestions), tag, sort);

  const footer = (
    <React.Fragment>
      <div className="minigrid footer">
        <div className="page">
          {getPageNavLinks(pageNumber, nTotal, pageSize, (page) => Url.getDiscussionsOptionsUrl({ page, sort, tag }))}
        </div>
        <div className="page">
          {getNavLinks(
            [15, 30, 50].map((n) => {
              return { text: "" + n, n };
            }),
            (n: number) => Url.getDiscussionsOptionsUrl({ pagesize: n as Url.PageSize, tag }),
            (n: number) => `show ${n} items per page`,
            pageSize,
            false
          )}
          <span className="dots">per page</span>
        </div>
      </div>
    </React.Fragment>
  );

  const content = summaries.map((summary) => getDiscussionSummary(summary));

  return {
    main: { content, title, subtitle, footer },
    width: "Closed",
  };
}

function formatNumber(count: number, things: string) {
  // https://blog.abelotech.com/posts/number-currency-formatting-javascript/
  const rc = count.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + " " + things.toLowerCase();
  return count === 1 && things[things.length - 1] === "s" ? rc.substring(0, rc.length - 1) : rc;
}
