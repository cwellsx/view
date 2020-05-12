import React from "react";
import "ui-assets/css/ErrorMessage.css";

/*
  Simple component to show an error message (or not if there isn't one)
*/

export interface ErrorMessageProps {
  errorMessage?: string;
  bold?: boolean;
}

export const ErrorMessage: React.FunctionComponent<ErrorMessageProps> = (props: ErrorMessageProps) => {
  const className: string = (props.errorMessage ? "error" : "hidden") + (props.bold ? " bold" : "");
  return <p className={className}>{props.errorMessage}</p>;
};
