import React from 'react';

interface ErrorMessageProps {
  errorMessage?: string,
}

export const ErrorMessage: React.FunctionComponent<ErrorMessageProps> = (props: ErrorMessageProps) => {
  const className: string = (props.errorMessage) ? "error" : "hidden";
  return (
    <p className={className}>{props.errorMessage}</p>
  );
}
