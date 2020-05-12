import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { Api, Url, Data } from "client";
import { useFetchApi2 } from "../hooks";
import { getPage, FetchedT, Layout, KeyedItem, SubTabs } from "../layouts";
import { notFound } from "./NotFound";
import { AnswerDiscussion } from "../forms";
import { getFirstMessage, getNextMessage, getPageNavLinks } from "../components";

export const Discussion: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const parsed = Url.isDiscussionOptions(props.location);
  if (Url.isParserError(parsed)) {
    return notFound(props, parsed.error);
  }

  return <DiscussionId discussion={parsed.discussion} sort={parsed.sort} page={parsed.page} />;
};

const DiscussionId: React.FunctionComponent<Url.DiscussionOptions> = (props: Url.DiscussionOptions) => {
  const { sort, discussion, page } = props;
  const options: Url.DiscussionOptions = React.useMemo(() => {
    return {
      sort,
      page,
      discussion: { id: discussion.id, name: discussion.name },
    };
  }, [sort, discussion.id, discussion.name, page]);

  return getPage(useFetchApi2(Api.getDiscussion, options), showDiscussion);
};

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
