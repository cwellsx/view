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

/*
  There's no README in the https://github.com/StackExchange/pagedown repo
  but there's one made for it at https://github.com/mmillican/pagedown which is
  copied from https://code.google.com/archive/p/pagedown/wikis/PageDown.wiki
*/

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

  function initialState(initialData: EditTagInfoProps): ValidatedState<T> {
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
          create: { type: "editor", editor: Editor },
        },
      ],
    ]);
    // reuse the default values for the initial state
    const { summary, markdown } = initialData;
    const state: T = {
      summary: summary ? summary : "",
      markdown: markdown ? markdown : "",
    };
    return createInitialState(inputs, state);
  }

  const [state, dispatch] = useReducer<T, EditTagInfoProps>(props, (x: EditTagInfoProps) => initialState(x));

  function getSummaryHint(): string {
    const count: number = maxLength - state.posted.summary.length;
    return `${count} characters left`;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (state.errorMessages.size) {
      // error messages are already displayed
      return;
    }
    // post edited profile to the server
    Api.editTagInfo(props.tag, state.posted)
      .then((tag: Data.Key) => {
        // construct the URL of the newly-edited user
        const url = Url.getTagInfoUrl(tag);
        // use history.push() to navigate programmatically
        // https://reacttraining.com/react-router/web/api/history
        // https://stackoverflow.com/questions/31079081/programmatically-navigate-using-react-router
        props.history.push(url);
      })
      .catch((error: Error) => dispatch({ key: "onSubmitError", newValue: error.message }));
  }

  // created the validated elements and the submit button
  const buttonText = { label: "Save Edits", noun: "post" };
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);

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
