import { config } from "client/src";
import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { NewDiscussion as NewDiscussionElement } from "../forms";
import { Layout, renderLayout } from "../layouts";

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
