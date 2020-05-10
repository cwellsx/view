import { FetchingT } from "../hooks";
import { renderLayout, Layout, loadingContents, loadingError } from "../PageLayout";

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
