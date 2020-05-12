import React from "react";
import { renderLayout, Layout } from "../layouts";
import { Login as LoginForm } from "../forms";

export const Login: React.FunctionComponent = () => {
  const content = <LoginForm />;
  const layout: Layout = { main: { content, title: "Login" }, width: "Open" };
  return renderLayout(layout);
};
