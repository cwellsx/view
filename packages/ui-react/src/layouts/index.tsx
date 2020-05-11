import React from "react";
import { FetchingT } from "../hooks";
import { renderLayout } from "./renderLayout";
import { Layout } from "./Layout";

export { renderLayout } from "./renderLayout";
export type { Layout, Tab, Tabs, SubTabs, RightContent, MainContent, Width, KeyedItem } from "./Layout";

export interface FetchedT<TData, TParam2> {
  data: TData;
  reload: () => void;
  newData: (param2: TParam2) => Promise<void>;
}

export type ShowDataT<TData, TParam2> = (fetched: FetchedT<TData, TParam2>) => Layout;

export function getPage<TData, TParam2>(
  fetched: FetchingT<TData, TParam2>,
  showData: ShowDataT<TData, TParam2>
): React.ReactElement {
  const { data, error, reload, newData } = fetched;

  const layout: Layout = data
    ? showData({ data, reload, newData }) // render the data
    : error
    ? loadingError(error) // else render error message
    : loadingContents; // else no data yet to render

  return renderLayout(layout);
}

const loadingContents: Layout = {
  main: { title: "Loading...", content: "..." },
  width: "Closed",
};

function loadingError(error: Error): Layout {
  const url = (error as any).url;
  const what = url ? <p>URL: "{url}"</p> : { undefined };
  const content = (
    <React.Fragment>
      {what}
      <p>Error: {error.message}</p>
    </React.Fragment>
  );
  return { main: { title: "Error", content }, width: "Open" };
}
