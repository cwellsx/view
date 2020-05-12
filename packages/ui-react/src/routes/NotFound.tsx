import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { ErrorMessage } from "../components";

export const NotFound: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  return notFound(props);
};

export function notFound(props: RouteComponentProps, error?: string) {
  const pathname = props.location.pathname;
  return (
    <div>
      <h3>Not Found</h3>
      <p>
        No page found for <code>{pathname}</code>
      </p>
      <ErrorMessage errorMessage={error} />
    </div>
  );
}
