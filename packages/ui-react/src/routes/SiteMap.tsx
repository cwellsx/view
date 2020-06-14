import { Data } from 'client/src';
import React from 'react';

import { getImageSummary, getTagSummary } from '../components';
import { useApi, useFetchApi } from '../hooks';
import { FetchedT, getPage, KeyedItem, Layout } from '../layouts';

export const SiteMap: React.FunctionComponent = () => {
  const api = useApi();
  return getPage(useFetchApi(api.getSiteMap), showSiteMap);
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
  data.images.forEach((x) => content.push(getImageSummary(x)));

  const features = (
    <React.Fragment>
      <h2>Features</h2>
      <div className="features">
        {data.tags.map((tag) => {
          const content = getTagSummary(tag);
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
