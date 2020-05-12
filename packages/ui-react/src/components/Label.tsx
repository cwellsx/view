import React from "react";

export interface Label {
  element?: React.ReactElement;
  name?: string;
}

export function createLabel(label: string, hideLabel?: boolean): Label {
  if (hideLabel) {
    return { name: undefined, element: undefined };
  }
  const name = label
    .replace(/[^A-Za-z0-9 ]/, "")
    .replace(/ /g, "-")
    .toLocaleLowerCase();
  const element = <label htmlFor={name}>{label}</label>;
  return { name, element };
}
