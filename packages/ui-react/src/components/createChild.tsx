import React from "react";
import { Label } from "../components";
import { Editor } from "./Editor";
import { Validated } from "./Validated";

type CreateInput = {
  type: "input";
  placeholder: string;
  attributes: React.InputHTMLAttributes<HTMLInputElement>;
};
type CreateTextArea = {
  type: "textarea";
  placeholder: string;
  attributes: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
};
type CreateEditor = {
  type: "editor";
};
export type CreateAny = CreateInput | CreateTextArea | CreateEditor;

export function createChild(
  create: CreateAny,
  defaultValue: string | undefined,
  handleChange: (newValue: string) => void,
  label: Label,
  errorMessage: string | undefined
): React.ReactElement {
  if (create.type === "editor") {
    return Editor({
      label,
      handleChange,
      defaultValue,
      errorMessage,
    });
  }
  function created(): React.ReactElement {
    switch (create.type) {
      case "input": {
        const attributes = create.attributes;
        const type = attributes.type ? attributes.type : "text";
        return (
          <input
            type={type}
            {...attributes}
            name={label.name}
            placeholder={create.placeholder}
            defaultValue={defaultValue}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      }
      case "textarea": {
        const attributes = create.attributes;
        return (
          <textarea
            {...attributes}
            name={label.name}
            placeholder={create.placeholder}
            defaultValue={defaultValue}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
      }
      default:
        throw new Error("Unexpected type");
    }
  }
  const child = created();
  return (
    <React.Fragment>
      {label.element}
      <Validated errorMessage={errorMessage}>{child}</Validated>
    </React.Fragment>
  );
}
