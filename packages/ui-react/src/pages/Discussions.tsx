import React from "react";
import { RouteComponentProps, NavLink, Link } from "react-router-dom";
import { Api, Url, Data, toHtml, config } from "client";
import { useFetchApi2, FetchingT, useMe } from "../hooks";
import { getPage, FetchedT, ShowDataT } from "../layouts";
import { Layout, KeyedItem, Tab, Tabs, SubTabs, MainContent } from "../layouts";
import { notFound } from "./NotFound";
import { History } from "history";
import { EditUserSettings } from "../Editor";
import * as Icon from "../icons";
import { getDiscussionsSubtitle, getPageNavLinks, getNavLinks, getDiscussionSummary } from "../components";

export const Discussions: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  // get the options
  const options = Url.isDiscussionsOptions(props.location);
  if (Url.isParserError(options)) {
    return notFound(props, options.error);
  }
  // split options into its components instead of passing whole options
  // otherwise the eslint "react-hooks/exhaustive-deps" rule wil complain when we use useMemo
  return <DiscussionsList sort={options.sort} pagesize={options.pagesize} page={options.page} tag={options.tag} />;
};

const DiscussionsList: React.FunctionComponent<Url.DiscussionsOptions> = (props: Url.DiscussionsOptions) => {
  const { sort, pagesize, page, tag } = props;
  const options: Url.DiscussionsOptions = React.useMemo(() => {
    return { sort, pagesize, page, tag };
  }, [sort, pagesize, page, tag]);

  return getPage(useFetchApi2(Api.getDiscussions, options), showDiscussions);
};

function showDiscussions(fetched: FetchedT<Data.Discussions, void>): Layout {
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
