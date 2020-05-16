import React from "react";
import { Login as LoginForm } from "../forms";
import { Layout, renderLayout } from "../layouts";

export const Login: React.FunctionComponent = () => {
  const content = <LoginForm />;
  const layout: Layout = { main: { content, title: "Login" }, width: "Open" };
  return renderLayout(layout);
};
