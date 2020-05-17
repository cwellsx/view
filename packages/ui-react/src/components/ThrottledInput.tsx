import { SearchInput } from "client";
import React from "react";
import { ErrorMessage } from "./ErrorMessage";
import { useThrottledInput } from "../hooks";

interface ThrottledInputProps {
  api: (input: SearchInput) => Promise<void>;
  placeholder: string;
}

export const ThrottledInput: React.FunctionComponent<ThrottledInputProps> = (props: ThrottledInputProps) => {
  const { api, placeholder } = props;
  const { value, setValue, errorMessage } = useThrottledInput(api);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value);

  return (
    <React.Fragment>
      <input type="text" onChange={handleChange} value={value} placeholder={placeholder} />
      <ErrorMessage errorMessage={errorMessage} />
    </React.Fragment>
  );
};
