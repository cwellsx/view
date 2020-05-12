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

interface AnswerDiscussionProps {
  discussionId: number;
  reload: () => void;
}
export const AnswerDiscussion: React.FunctionComponent<AnswerDiscussionProps> = (props) => {
  type T = Post.NewMessage;

  function initialState(): ValidatedState<T> {
    const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
      [
        "markdown",
        {
          label: "Body",
          hideLabel: true,
          options: { minLength: config.minLengths.body },
          create: { type: "editor", editor: Editor },
        },
      ],
    ]);
    // reuse the default values for the initial state
    const state: T = { markdown: "" };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer0<T>(() => initialState());

  const { discussionId, reload } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size) {
      // error messages are already displayed
      return;
    }
    Api.newMessage(discussionId, state.posted)
      .then((__message: Data.Message) => {
        // could push the received message into the display
        // but instead let's force a reload e.g. to see whether any other user has posted too
        reload();
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  }

  // created the validated elements and the submit button
  const buttonText = { label: "Post Your Answer", noun: "answer" };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

  const form = (
    <form className="editor" onSubmit={handleSubmit}>
      <h2>Your Answer</h2>
      {mapInputs.get("markdown")}
      <div className="submit">{button}</div>
    </form>
  );

  return form;
};
