import 'ui-assets/css/Login.css';

import { Data, Post } from 'client/src';
import React from 'react';

import { Input, useApi, useSetMe, useValidatedInput } from '../hooks';

export const Login: React.FunctionComponent = () => {
  type T = Post.Login;
  const api = useApi();

  const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
    [
      "userName",
      {
        label: "Username",
        hideLabel: true,
        options: {},
        create: { type: "input", placeholder: "Username", attributes: {} },
      },
    ],
    [
      "password",
      {
        label: "Password",
        hideLabel: true,
        options: {},
        create: { type: "input", placeholder: "Password", attributes: {} },
      },
    ],
  ]);
  // reuse the default values for the initial state
  const initialState: T = { userName: "", password: "" };
  const buttonText = { label: "Submit", noun: "login" };
  const { currentState, isError, button, mapInputs, onSubmitError } = useValidatedInput<T>(
    inputs,
    initialState,
    buttonText
  );

  const setMe = useSetMe();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isError) {
      // error messages are already displayed
      return;
    }
    api
      .login(currentState)
      .then((userSummary: Data.UserSummary) => setMe(userSummary))
      .catch(onSubmitError);
  }

  const content = (
    <React.Fragment>
      <p>This will be a login page, with user name and password.</p>
      <p>For this prototype, just press the button to simulate a login.</p>
      <form className="login" onSubmit={handleSubmit}>
        <div className="p">{mapInputs.get("userName")}</div>
        <div className="p">{mapInputs.get("password")}</div>
        <div className="p">{button}</div>
      </form>
      <h3>Only in this prototype</h3>
      <p>The UI details for creating a new account are not defined yet.</p>
      <p>If you refresh the page, then this application is reloaded and:</p>
      <ul>
        <li>The login is reset</li>
        <li>Any other data you entered is reset</li>
      </ul>
      <p>This is a prototype of the UI, without a server: so any data you enter isn't permanently stored anywhere.</p>
    </React.Fragment>
  );
  return content;
};
