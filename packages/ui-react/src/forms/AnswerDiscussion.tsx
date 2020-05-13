import { Api, config, Data, Post } from "client";
import React from "react";
import { Editor } from "../components";
import { Input, useValidatedInput } from "../hooks";

interface AnswerDiscussionProps {
  discussionId: number;
  reload: () => void;
}
export const AnswerDiscussion: React.FunctionComponent<AnswerDiscussionProps> = (props) => {
  type T = Post.NewMessage;

  // created the validated elements and the submit button
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
  const initialState: T = { markdown: "" };
  const buttonText = { label: "Post Your Answer", noun: "answer" };
  const { currentState, isError, button, mapInputs, onSubmitError } = useValidatedInput<T>(
    inputs,
    initialState,
    buttonText
  );

  const { discussionId, reload } = props;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isError) {
      // error messages are already displayed
      return;
    }
    Api.newMessage(discussionId, currentState)
      .then((__message: Data.Message) => {
        // could push the received message into the display
        // but instead let's force a reload e.g. to see whether any other user has posted too
        reload();
      })
      .catch(onSubmitError);
  }

  const form = (
    <form className="editor" onSubmit={handleSubmit}>
      <h2>Your Answer</h2>
      {mapInputs.get("markdown")}
      <div className="submit">{button}</div>
    </form>
  );

  return form;
};
