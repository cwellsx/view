import React from "react";
import { ErrorMessage } from "./ErrorMessage";

export function getSubmitButton(label: string, onClick: () => void, errorMessage?: string) {
  function handleClick(e: React.MouseEvent): void {
    onClick();
  }
  return (
    <div>
      <input type="submit" value={label} onClick={handleClick} />
      <ErrorMessage errorMessage={errorMessage} bold={true} />
    </div>
  );
}
