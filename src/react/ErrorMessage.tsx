import React from 'react';
import "./ErrorMessage.css";
import * as Icon from "../icons";

/*
  Simple component to show an error message (or not if there isn't one)
*/

interface ErrorMessageProps {
  errorMessage?: string,
  bold?: boolean
}

export const ErrorMessage: React.FunctionComponent<ErrorMessageProps> = (props: ErrorMessageProps) => {
  const className: string = ((props.errorMessage) ? "error" : "hidden") + (props.bold ? " bold" : "");
  return (
    <p className={className}>{props.errorMessage}</p>
  );
}

/*
  Component to display an <input> or <taxarea> element with a validation error message
*/

type ValidatedProps = ErrorMessageProps & {
  // https://fettblog.eu/typescript-react/children/
  // https://github.com/donaldpipowitch/typed-react-children-with-typescript
  children: React.ReactElement
};

export const Validated = (props: ValidatedProps) => {

  const { errorMessage } = props;

  // https://stackoverflow.com/questions/36750387/react-adding-props-to-an-existing-component
  const className = !props.children.props.className ? "invalid" : "invalid " + props.children.props.className;
  const child = (!errorMessage) ? props.children : React.cloneElement(props.children, { className });
  const icon = (!errorMessage) ? undefined : <Icon.Error className="error" fill="#dc3d4c" />;
  return (
    <React.Fragment>
      <div className="validated">
        {child}
        {icon}
      </div>
      <ErrorMessage errorMessage={errorMessage} />
    </React.Fragment>
  );
}

/*
  State to contain the data for validated elements

  Assume that input is collected to be posted to the server in an object of type T.
*/

export interface Label {
  element?: React.ReactElement,
  name?: string
}

function createLabel(label: string, hideLabel?: boolean): Label {
  if (hideLabel) {
    return { name: undefined, element: undefined };;
  }
  const name = label.replace(/[^A-Za-z0-9 ]/, "").replace(/ /g, "-").toLocaleLowerCase();
  const element = <label htmlFor={name}>{label}</label>
  return { name, element };
}

export interface ValidatedEditorProps {
  label: Label,
  defaultValue?: string,
  errorMessage?: string,
  handleChange: (newValue: string) => void
};

type CreateInput = {
  type: "input", placeholder: string,
  attributes: React.InputHTMLAttributes<HTMLInputElement>
};
type CreateTextArea = {
  type: "textarea", placeholder: string,
  attributes: React.TextareaHTMLAttributes<HTMLTextAreaElement>
};
type CreateEditor = {
  type: "editor",
  editor: (props: ValidatedEditorProps) => React.ReactElement
};
type CreateAny = CreateInput | CreateTextArea | CreateEditor;

export interface Input {
  label: string,
  hideLabel?: boolean
  options: ValidationOptions,
  create: CreateAny
}

export interface ValidatedState<T extends object> {
  // initial state defines the initial defaultValue for each input element
  defaultValues: T;
  // edited state to be posted
  posted: T;
  // validation errors
  errorMessages: Map<keyof T, string>;
  // could define input elsewhere, but it's convenient to define it here in state where it's accessible to dispatcher
  inputs: Map<keyof T, Input>;
  // don't display validation errors until after first submit attempt
  onSubmit: boolean;
  // summary of other validation errors, displayed next to the submit button
  onSubmitError: string | undefined;
}

export function createInitialState<T extends object>(
  inputs: Map<keyof T, Input>,
  state: T
): ValidatedState<T> {
  const errorMessages = new Map<keyof T, string>();
  // test the initial validity of each value (which will be recalculated onChange)
  inputs.forEach((input, key) => {
    const value = state[key];
    if (typeof value === "string") {
      const errorMessage = validate(value, input.options, input.label);
      if (errorMessage) {
        errorMessages.set(key, errorMessage);
      }
    } else {
      throw new Error("This type of input validation can only be used for string-type elements");
    }
  });
  return {
    posted: state,
    defaultValues: state,
    errorMessages,
    inputs,
    onSubmit: false,
    onSubmitError: undefined,
  }
}

/*
  A reducer for the above state
*/

export function useReducer<T extends object, TData>(initData: TData, initializer: (arg: TData) => ValidatedState<T>) {
  // ideally TypeScript could deduce the type arguments of React.useReducer from the parameters passed to it
  // but it gets confused if we don't specify those arguments, perhaps because the parameters are themselves generic
  return React.useReducer<React.Reducer<ValidatedState<T>, Action<T>>, TData>(
    reducer, initData, initializer);
}

export function useReducer0<T extends object>(initializer: () => ValidatedState<T>) {
  // ideally TypeScript could deduce the type arguments of React.useReducer from the parameters passed to it
  // but it gets confused if we don't specify those arguments, perhaps because the parameters are themselves generic
  return React.useReducer<React.Reducer<ValidatedState<T>, Action<T>>, undefined>(
    reducer, undefined, initializer);
}

export type Action<T extends object> = { key: keyof T | "onSubmit" | "onSubmitError", newValue: string };

export function reducer<T extends object>(old: ValidatedState<T>, action: Action<T>): ValidatedState<T> {
  const { key, newValue } = action;
  let { posted, errorMessages, onSubmit, onSubmitError, defaultValues } = old;
  if (key === "onSubmit") {
    onSubmit = true;
  } else if (key === "onSubmitError") {
    onSubmitError = newValue;
  } else {
    onSubmitError = undefined;
    // new state from old state
    posted = { ...posted };
    // cast to any because this template doesn't know that every element is of type string
    // alternative would be to add an 
    (posted as any)[key] = newValue;
    // input data for this key
    const input = old.inputs.get(key)!;
    // errorMessage for this value
    const errorMessage = validate(newValue, input.options, input.label);
    // clone from the old state
    errorMessages = new Map<keyof T, string>(errorMessages);
    // insert new error message
    if (!errorMessage) {
      errorMessages.delete(key);
    } else {
      errorMessages.set(key, errorMessage);
    }
  }
  // return new state (including unaltered copy of input)
  return { posted, errorMessages, inputs: old.inputs, onSubmit, onSubmitError, defaultValues };
}

/*
  A factory which creates Validated elements (and a Validated submit button) from the above input
*/

export function createValidated<T extends object>(
  state: ValidatedState<T>,
  dispatch: React.Dispatch<Action<T>>,
  buttonText: { label: string, noun: string, })
  : {
    mapInputs: Map<keyof T, React.ReactElement>,
    button: React.ReactElement
  } {
  // created a Validated element for each key
  const rc: Map<keyof T, React.ReactElement> = new Map<keyof T, React.ReactElement>();
  state.inputs.forEach((input, key) => {
    // the child's onChange handler goes into the dispatcher with an added key
    const handleChange: (newValue: string) => void = (newValue: string) => dispatch({ key, newValue });
    // create the label
    const label = createLabel(input.label, input.hideLabel);
    // and other input parameters
    const errorMessage: string | undefined = !state.onSubmit ? undefined : state.errorMessages.get(key);
    const { create } = input;
    const defaultValue = "" + state.defaultValues[key];
    // created the Validated and its child
    if (create.type === "editor") {
      const validated: React.ReactElement = create.editor({ label, handleChange, defaultValue, errorMessage });
      rc.set(key, validated);
    } else {
      const child = createChild(create, defaultValue, handleChange, label);
      const validated = (
        <React.Fragment>
          {label.element}
          <Validated errorMessage={errorMessage}>{child}</Validated>
        </React.Fragment>
      );
      rc.set(key, validated);
    }
  });
  // also create a button
  function getButtonError(state: ValidatedState<T>): string | undefined {
    const countErrors = state.errorMessages.size;
    const error = (countErrors === 1) ? "error" : "errors";
    const rc: string | undefined = state.onSubmitError ? state.onSubmitError :
      !state.onSubmit || !countErrors ? undefined :
        `Your ${buttonText.noun} couldn't be submitted. Please see the ${error} above.`;
    return rc;
  }
  function handleClick(e: React.MouseEvent): void {
    dispatch({ key: "onSubmit", newValue: "" });
  }
  const buttonError = getButtonError(state);
  const button = (
    <div>
      <input type="submit" value={buttonText.label} onClick={handleClick} />
      <ErrorMessage errorMessage={buttonError} bold={true} />
    </div>
  );
  return { mapInputs: rc, button };
}

function createChild(create: CreateAny, defaultValue: string | undefined, handleChange: (newValue: string) => void,
  label: Label): React.ReactElement {
  switch (create.type) {
    case "input": {
      const attributes = create.attributes;
      const type = attributes.type ? attributes.type : "text";
      return <input type={type} {...attributes} name={label.name}
        placeholder={create.placeholder} defaultValue={defaultValue} onChange={e => handleChange(e.target.value)} />;
    }
    case "textarea": {
      const attributes = create.attributes;
      return <textarea {...attributes} name={label.name}
        placeholder={create.placeholder} defaultValue={defaultValue} onChange={e => handleChange(e.target.value)} />
    }
    default:
      throw new Error("Unexpected type");
  }
}

/*
  Function to define standard validation options
*/

export interface ValidationOptions { optional?: boolean, minLength?: number };

export function validate(value: string, options: ValidationOptions, label: string): string | undefined {
  const isOptional = !!options.optional;
  if (!isOptional && (!value || (value === ""))) {
    return `${label} is missing.`;
  }
  const length = !value ? 0 : value.length;
  if (options.minLength && (length < options.minLength)) {
    return (options.minLength <= 15)
      ? `${label} must be at least ${options.minLength} characters.`
      : `${label} must be at least ${options.minLength} characters; you entered ${length}.`
  }
  return undefined;
}
