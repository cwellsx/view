import React from "react";
import { RouteComponentProps, NavLink, Link } from "react-router-dom";
import { Api, Url, Data, toHtml, config } from "client";
import { useFetchApi2, FetchingT, useMe } from "../hooks";
import { getPage, FetchedT, ShowDataT } from "../layouts";
import { Layout, renderLayout } from "../PageLayout";
import { notFound } from "./NotFound";
import { History } from "history";
import { NewDiscussion as NewDiscussionElement } from "../Editor";
import * as Icon from "../icons";

export const NewDiscussion: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  // this is unusual because we don't need to fetch data before rendering this element
  const content = <NewDiscussionElement history={props.history} />;
  const title = config.strNewQuestion.title;
  const layout: Layout = {
    main: { content, title },
    width: "None",
  };
  return renderLayout(layout);
};
