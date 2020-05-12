import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { config } from "client";
import { Layout, renderLayout } from "../layouts";
import { NewDiscussion as NewDiscussionElement } from "../forms";

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
