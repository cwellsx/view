import React from "react";
import "ui-assets/css/ErrorMessage.css";
import { ErrorMessage, ErrorMessageProps } from "../components";
import * as Icon from "../icons";

type ValidatedProps = ErrorMessageProps & {
  // https://fettblog.eu/typescript-react/children/
  // https://github.com/donaldpipowitch/typed-react-children-with-typescript
  children: React.ReactElement;
};

export const Validated = (props: ValidatedProps) => {
  const { errorMessage } = props;

  // https://stackoverflow.com/questions/36750387/react-adding-props-to-an-existing-component
  const className = !props.children.props.className ? "invalid" : "invalid " + props.children.props.className;
  const child = !errorMessage ? props.children : React.cloneElement(props.children, { className });
  const icon = !errorMessage ? undefined : <Icon.Error className="error" fill="#dc3d4c" />;
  return (
    <React.Fragment>
      <div className="validated">
        {child}
        {icon}
      </div>
      <ErrorMessage errorMessage={errorMessage} />
    </React.Fragment>
  );
};
