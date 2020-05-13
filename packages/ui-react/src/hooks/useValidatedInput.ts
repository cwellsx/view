import React from "react";
import "ui-assets/css/ErrorMessage.css";
import { CreateAny, createChild, createLabel, getSubmitButton } from "../components";

/*
  Component to display an <input> or <taxarea> element with a validation error message
*/

interface ValidationOptions {
  optional?: boolean;
  minLength?: number;
}

export interface Input {
  label: string;
  hideLabel?: boolean;
  options: ValidationOptions;
  create: CreateAny;
}

export function useValidatedInput<T extends object>(
  inputs: Map<keyof T, Input>,
  initialState: T,
  buttonText: { label: string; noun: string }
): {
  currentState: T;
  isError: boolean;
  isAfterSubmit: boolean;
  button: React.ReactElement;
  mapInputs: Map<keyof T, React.ReactElement>;
  onSubmitError: (error: Error) => void;
} {
  // ideally TypeScript could deduce the type arguments of React.useReducer from the parameters passed to it
  // but it gets confused if we don't specify those arguments, perhaps because the parameters are themselves generic,
  const [state, dispatch] = React.useReducer<React.Reducer<ValidatedState<T>, Action<T>>>(
    reducer,
    createInitialState(inputs, initialState)
  );
  const { mapInputs, button } = createValidated<T>(state, dispatch, buttonText);
  const onSubmitError = (error: Error) => dispatch({ key: "onSubmitError", newValue: error.message });
  return {
    currentState: state.posted,
    isError: state.errorMessages.size !== 0,
    isAfterSubmit: state.isAfterSubmit,
    button,
    mapInputs,
    onSubmitError,
  };
}

/*
  State to contain the data for validated elements

  Assume that input/initial data values of type T will to be posted to the server in an object of type T.
*/

interface ValidatedState<T extends object> {
  // initial state defines the initial defaultValue for each input element
  defaultValues: T;
  // edited state to be posted
  posted: T;
  // validation errors
  errorMessages: Map<keyof T, string>;
  // could define input elsewhere, but it's convenient to define it here in state where it's accessible to dispatcher
  inputs: Map<keyof T, Input>;
  // don't display validation errors until after first submit attempt
  isAfterSubmit: boolean;
  // summary of other validation errors, displayed next to the submit button
  onSubmitError: string | undefined;
}

function createInitialState<T extends object>(inputs: Map<keyof T, Input>, state: T): ValidatedState<T> {
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
    isAfterSubmit: false,
    onSubmitError: undefined,
  };
}

/*
  A reducer for the above state
*/

type Action<T extends object> = {
  key: keyof T | "onSubmit" | "onSubmitError";
  newValue: string;
};

function reducer<T extends object>(old: ValidatedState<T>, action: Action<T>): ValidatedState<T> {
  const { key, newValue } = action;
  let { posted, errorMessages, isAfterSubmit: onSubmit, onSubmitError, defaultValues } = old;
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
  return {
    posted,
    errorMessages,
    inputs: old.inputs,
    isAfterSubmit: onSubmit,
    onSubmitError,
    defaultValues,
  };
}

/*
  A factory which creates Validated elements (and a Validated submit button) from the above input
*/

function createValidated<T extends object>(
  state: ValidatedState<T>,
  dispatch: React.Dispatch<Action<T>>,
  buttonText: { label: string; noun: string }
): {
  mapInputs: Map<keyof T, React.ReactElement>;
  button: React.ReactElement;
} {
  // created a Validated element for each key
  const mapInputs: Map<keyof T, React.ReactElement> = new Map<keyof T, React.ReactElement>();
  state.inputs.forEach((input, key) => {
    // the child's onChange handler goes into the dispatcher with an added key
    const handleChange: (newValue: string) => void = (newValue: string) => dispatch({ key, newValue });
    // create the label
    const label = createLabel(input.label, input.hideLabel);
    // and other input parameters
    const errorMessage: string | undefined = !state.isAfterSubmit ? undefined : state.errorMessages.get(key);
    const { create } = input;
    const defaultValue = "" + state.defaultValues[key];
    // created the Validated and its child
    const validated = createChild(create, defaultValue, handleChange, label, errorMessage);
    mapInputs.set(key, validated);
  });
  // also create a button
  function getButtonError(state: ValidatedState<T>): string | undefined {
    const countErrors = state.errorMessages.size;
    const error = countErrors === 1 ? "error" : "errors";
    const rc: string | undefined = state.onSubmitError
      ? state.onSubmitError
      : !state.isAfterSubmit || !countErrors
      ? undefined
      : `Your ${buttonText.noun} couldn't be submitted. Please see the ${error} above.`;
    return rc;
  }
  const button = getSubmitButton(
    buttonText.label,
    () => dispatch({ key: "onSubmit", newValue: "" }),
    getButtonError(state)
  );
  return { mapInputs, button };
}

/*
  Function to define standard validation options, called from createInitialState and from reducer
*/

function validate(value: string, options: ValidationOptions, label: string): string | undefined {
  const isOptional = !!options.optional;
  if (!isOptional && (!value || value === "")) {
    return `${label} is missing.`;
  }
  const length = !value ? 0 : value.length;
  if (options.minLength && length < options.minLength) {
    return options.minLength <= 15
      ? `${label} must be at least ${options.minLength} characters.`
      : `${label} must be at least ${options.minLength} characters; you entered ${length}.`;
  }
  return undefined;
}
