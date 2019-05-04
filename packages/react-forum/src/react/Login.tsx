import React, { FunctionComponent, FormEvent, useState, useEffect } from 'react';
import { renderContentOne } from './Column';
import * as I from "../data";
import * as IO from "../io";
import {ErrorMessage} from "./ErrorMessage";

export const Login: FunctionComponent = () => {

  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const inputUserName = React.createRef<HTMLInputElement>();
  const inputPassword = React.createRef<HTMLInputElement>();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    const userName = inputUserName.current!.value;
    const password = inputPassword.current!.value;
    IO.login({userName, password})
      .then((userSummary: I.UserSummary) => {})
      .catch((error: Error) => setErrorMessage(error.message));
    event.preventDefault();
  };

  const contents = (
    <React.Fragment>
      <p>This will be a login page, with user name and password.</p>
      <p>For this prototype, just press the button to simulate a login.</p>
      <form onSubmit={handleSubmit}>
        <p><input type="text" ref={inputUserName} placeholder="Username" /></p>
        <p><input type="text" ref={inputPassword} placeholder="Password" /></p>
        <p><input type="submit" value="Submit" /></p>
        <ErrorMessage errorMessage={errorMessage} />
      </form>
      <p>The UI details for creating a new account are not defined yet.</p>
      <p>
        Also, only in this prototype, if you refresh the page then this application is reloaded and the login is reset.
      </p>
    </React.Fragment>
  );
  return renderContentOne({ title: "Login", contents });
}

