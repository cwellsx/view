import React, { useEffect } from "react";
import "pagedown-editor/sample-bundle";
import "pagedown-editor/pagedown.css";
import "ui-assets/css/Editor.css";
import { Api, Data, Url, Post, config } from "client";
import { EditorTags, OutputTags } from "../EditorTags";
import { History } from "history";
import { Editor } from "./Editor";
import {
  ValidatedState,
  createValidated,
  Input,
  createInitialState,
  useReducer,
  useReducer0,
  ValidatedEditorProps,
  Validated,
} from "../ErrorMessage";

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

  function initialState(initialData: EditUserSettingsProps): ValidatedState<T> {
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
          create: { type: "editor", editor: Editor },
        },
      ],
    ]);
    // reuse the default values for the initial state
    const { name, location, email, aboutMe } = initialData;
    const state: T = {
      name,
      location: location ? location : "",
      email,
      aboutMe: aboutMe ? aboutMe : "",
    };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer<T, EditUserSettingsProps>(props, (x: EditUserSettingsProps) => initialState(x));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size) {
      // error messages are already displayed
      return;
    }
    // post edited profile to the server
    Api.editUserProfile(props.userId, state.posted)
      .then((idName: Data.IdName) => {
        // construct the URL of the newly-edited user
        const url = Url.getUserUrl(idName);
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        props.history.push(url);
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  }

  // created the validated elements and the submit button
  const buttonText = { label: "Save Changes", noun: "changed settings" };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

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
