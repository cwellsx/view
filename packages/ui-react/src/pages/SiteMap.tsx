import React from "react";
import { Api, Data } from "client";
import { useFetchApi } from "../hooks";
import { getPage, FetchedT } from "../layouts";
import * as Summaries from "../Components";
import { Layout, KeyedItem } from "../PageLayout";

export const SiteMap: React.FunctionComponent = () => {
  return getPage(useFetchApi(Api.getSiteMap), showSiteMap);
};

function showSiteMap(fetched: FetchedT<Data.SiteMap, void>): Layout {
  const { data } = fetched;
  const content: KeyedItem[] = [];

  /*
    visitors can see:
    - image document[s]
    - (featured) articles
    - (text) sources

    and cannot see:
    - users
    - discussions
    - feaure reports
    - notable omissions
  */

  // render the images
  data.images.forEach((x) => content.push(Summaries.getImageSummary(x)));

  const features = (
    <React.Fragment>
      <h2>Features</h2>
      <div className="features">
        {data.tags.map((tag) => {
          const content = Summaries.getTagSummary(tag);
          /*
            either we need to add whitespace between elements ...
            - https://github.com/facebook/react/issues/1643
            - https://reactjs.org/blog/2014/02/20/react-v0.9.html#jsx-whitespace
            ... or to add whitespace between spans ...
            - https://github.com/facebook/react/issues/1643#issuecomment-321439506
          */
          return <span key={content.key}>{content.element}</span>;
        })}
      </div>
    </React.Fragment>
  );

  content.push({ element: features, key: "Feature" });

  return { main: { title: "Site Map", content }, width: "Closed" };
}
