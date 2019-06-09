import React from 'react';
import { useLayout, Layout } from './PageLayout';
import * as I from "../data";
import * as IO from "../io";
import { AppContext, AppContextProps } from './AppContext';
import * as Post from "../shared/post";
import { ValidatedState, createValidated, Input, createInitialState, useReducer0 } from "./ErrorMessage";
import "./Login.css"

export const Login: React.FunctionComponent = () => {

  type T = Post.Login;

  function initialState(): ValidatedState<T> {
    const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
      ["userName", {
        label: "Username",
        hideLabel: true,
        options: {},
        create: { type: "input", placeholder: "Username", attributes: {} }
      }],
      ["password", {
        label: "Password",
        hideLabel: true,
        options: {},
        create: { type: "input", placeholder: "Password", attributes: {} }
      }],
    ]);
    // reuse the default values for the initial state
    const state: T = { userName: "", password: "" };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer0<T>(() => initialState());

  const appContext: AppContextProps = React.useContext(AppContext);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size) {
      // error messages are already displayed
      return;
    }
    IO.login(state.posted)
      .then((userSummary: I.UserSummary) => appContext.setMe(userSummary))
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  };

  // created the validated elements and the submit button
  const buttonText = { label: "Submit", noun: "login" };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

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
  const layout: Layout = { main: { content, title: "Login" }, width: "Open" };
  return useLayout(layout);
}

