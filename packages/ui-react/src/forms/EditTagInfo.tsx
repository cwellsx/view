import { Api, Data, Post, Url } from "client";
import { History } from "history";
import React from "react";
import { Input, useValidatedInput } from "../hooks";

/*
  Edit Tag Info
*/

interface EditTagInfoProps {
  history: History;
  tag: string;
  summary?: string;
  markdown?: string;
}
export const EditTagInfo: React.FunctionComponent<EditTagInfoProps> = (props: EditTagInfoProps) => {
  type T = Post.EditTagInfo;

  const { min: minLength, max: maxLength } = Data.tagSummaryLength;

  const inputs: Map<keyof T, Input> = new Map<keyof T, Input>([
    [
      "summary",
      {
        label: "Summary",
        options: { minLength },
        create: {
          type: "textarea",
          placeholder: "",
          attributes: { rows: 7, maxLength },
        },
      },
    ],
    [
      "markdown",
      {
        label: "Description",
        options: { optional: true },
        create: { type: "editor" },
      },
    ],
  ]);
  // reuse the default values for the initial state
  const { summary, markdown } = props;
  const initialState: T = {
    summary: summary ? summary : "",
    markdown: markdown ? markdown : "",
  };

  const buttonText = { label: "Save Edits", noun: "post" };
  const { currentState, isError, button, mapInputs, onSubmitError } = useValidatedInput<T>(
    inputs,
    initialState,
    buttonText
  );

  function getSummaryHint(): string {
    const count: number = maxLength - currentState.summary.length;
    return `${count} characters left`;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (isError) {
      // error messages are already displayed
      return;
    }
    // post edited profile to the server
    Api.editTagInfo(props.tag, currentState)
      .then((tag: Data.Key) => {
        // construct the URL of the newly-edited user
        const url = Url.getTagInfoUrl(tag);
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        props.history.push(url);
      })
      .catch(onSubmitError);
  }

  return (
    <form className="editor tag-wiki" onSubmit={handleSubmit}>
      <div className="element">
        {mapInputs.get("summary")}
        <p className="hint">(plain text only, no Markdown formatting)</p>
        <p className="hint next">{getSummaryHint()}</p>
      </div>
      <div className="element">{mapInputs.get("markdown")}</div>
      <div className="element">{button}</div>
    </form>
  );
};
