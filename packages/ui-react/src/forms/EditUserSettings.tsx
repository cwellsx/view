import { Api, Data, Post, Url } from "client/src";
import { History } from "history";
import React from "react";
import { Input, useValidatedInput } from "../hooks";

// this is a separate function component instead of just being incide the getSettingsContent function
// [because it contains hooks](https://reactjs.org/docs/hooks-rules.html#only-call-hooks-from-react-functions)
interface EditUserSettingsProps {
  history: History;
  name: string;
  location?: string;
  aboutMe?: string;
  email: string;
  userId: number;
  gravatar: React.ReactElement;
}
export const EditUserSettings: React.FunctionComponent<EditUserSettingsProps> = (props: EditUserSettingsProps) => {
  type T = Post.EditUserProfile;

  const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
    [
      "name",
      {
        label: "Display name",
        options: {},
        create: { type: "input", placeholder: "required", attributes: {} },
      },
    ],
    [
      "location",
      {
        label: "Location (optional)",
        options: { optional: true },
        create: { type: "input", placeholder: "optional", attributes: {} },
      },
    ],
    [
      "email",
      {
        label: "Email",
        options: {},
        create: { type: "input", placeholder: "required", attributes: {} },
      },
    ],
    [
      "aboutMe",
      {
        label: "About me",
        options: { optional: true },
        create: { type: "editor" },
      },
    ],
  ]);
  // reuse the default values for the initial state
  const { name, location, email, aboutMe } = props;
  const initialState: T = {
    name,
    location: location ? location : "",
    email,
    aboutMe: aboutMe ? aboutMe : "",
  };
  const buttonText = { label: "Save Changes", noun: "changed settings" };
  const { currentState, isError, button, mapInputs, onSubmitError } = useValidatedInput<T>(
    inputs,
    initialState,
    buttonText
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isError) {
      // error messages are already displayed
      return;
    }
    // post edited profile to the server
    Api.editUserProfile(props.userId, currentState)
      .then((idName: Data.IdName) => {
        // construct the URL of the newly-edited user
        const url = Url.getUserUrl(idName);
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        props.history.push(url);
      })
      .catch(onSubmitError);
  }

  return (
    <form className="editor settings" onSubmit={handleSubmit}>
      <h1>Edit</h1>
      <h2>Public information</h2>
      <div className="public">
        {props.gravatar}
        <div className="column">
          {mapInputs.get("name")}
          {mapInputs.get("location")}
        </div>
      </div>
      {mapInputs.get("aboutMe")}
      <h2>Private settings</h2>
      {mapInputs.get("email")}
      <div className="submit">{button}</div>
    </form>
  );
};
