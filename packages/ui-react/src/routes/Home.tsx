import React from "react";
import { Api } from "client";
import { useFetchApi2, FetchingT } from "../hooks";
import { getPage, FetchedT, ShowDataT, Layout } from "../layouts";
import { htmlToReact } from "../components";
import { toHtml } from "client";

type FetchedIsHtml = { isHtml: boolean };

export const Home: React.FunctionComponent = () => {
  const isHtml = false;
  const filename = isHtml ? "home.html" : "home.md";
  const fetching: FetchingT<string, void> = useFetchApi2(Api.getPublic, filename);
  const showData: ShowDataT<string, void> = (fetched: FetchedT<string, void>) => showHome(fetched, { isHtml });
  return getPage(fetching, showData);
};

function showHome(fetched: FetchedT<string, void>, extra: { isHtml: boolean }): Layout {
  const { data } = fetched;
  const { isHtml } = extra;
  function parse() {
    const lines = data.split(/\r?\n/);
    const found = lines.find((s) => s.startsWith(isHtml ? "<h1>" : "# "));
    if (found) {
      const title = isHtml ? found.substring(4, found.length - 5).trim() : found.substring(2).trim();
      const sliced = lines.slice(1).join("\r\n");

      return { title, sliced };
    } else {
      return { title: "Untitled?", sliced: data };
    }
  }
  const { title, sliced } = parse();
  const html = isHtml ? sliced : toHtml(sliced).__html;
  // htmlToReact(html) replaces `<a>` with `<Link>` instead of using `<div dangerouslySetInnerHTML={{ __html: html }} />`
  const content = htmlToReact(html);
  return { main: { title, content }, width: "Open" };
}
