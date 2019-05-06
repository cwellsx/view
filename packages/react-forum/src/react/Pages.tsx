import React from 'react';
import * as I from "../data";
import { Content, Contents } from './Column';
import * as Summaries from "./Summaries";
import './Pages.css';

/*
  While `App.tsx` defines "container" components, which manage routes and state,
  conversely this `Page.tsx` defines "presentational" components.
*/

export type Present<T> = (data: T) => Contents;

/*
  SiteMap
*/

export const SiteMap: Present<I.SiteMap> = (data: I.SiteMap): Contents => {
  const contents: Content[] = [];

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
  data.images.forEach(x => contents.push(Summaries.getImageSummary(x)));

  const features = (
    <React.Fragment>
      <h2>Features</h2>
      <div className="features">
        {data.features.map(feature => {
          const content = Summaries.getFeatureSummary(feature);
          /*
            either we need to add whitespace between elements ...
            - https://github.com/facebook/react/issues/1643
            - https://reactjs.org/blog/2014/02/20/react-v0.9.html#jsx-whitespace
            ... or to add whitespace between spans ...
            - https://github.com/facebook/react/issues/1643#issuecomment-321439506
          */
          return (
            <span key={content.key}>
              {content.element}
            </span>
          );
        })}
      </div>
    </React.Fragment>
  );

  contents.push({ element: features, key: "Feature" });

  return { main: contents };
}

/*
  Image
*/

function getLayerKey(layer: I.LayerNode): string {
  return (layer.alias)
    ? layer.alias
    : layer.name.toLowerCase().replace("&", "and").replace(" ", "-");
}

function handleLayerChange(event: React.ChangeEvent<HTMLInputElement>) {
  const target = event.target;
  const alias: string | null = target.getAttribute("name");
  const checked: boolean = target.checked;
  alert(`In the non-prototype this would ${(checked) ? "show" : "hide"} the '${alias}' image layer`);
}

function renderNode(node: I.LayerNode, alias: string): React.ReactElement {
  // https://stackoverflow.com/questions/26615779/react-checkbox-not-sending-onchange
  return <label><input type="checkbox" defaultChecked={true} onChange={handleLayerChange} name={alias} />{node.name}</label>
}

function renderLayers(layers: I.ImageLayers, level: number): React.ReactElement {
  const className = (level === 0) ? "image-layers" : undefined;
  //const white = "  ".repeat(level + 1);
  const listItems = layers.map((node) => {
    const alias = getLayerKey(node);
    return (
      <li key={alias} className={node.children ? "parent" : undefined}>
        {renderNode(node, alias)}
        {node.children && renderLayers(node.children, level + 1)}
      </li>
    );
  });
  return (
    <ul className={className}>
      {listItems}
    </ul>
  )
}

export const Image: Present<I.Image> = (data: I.Image): Contents => {
  const images =
    <div className="image-images">
      <img src={data.image.src} height={data.image.height} width={data.image.width} />
    </div>;
  const layers = renderLayers(data.layers, 0);
  return {
    main: images,
    width: "Full",
    right: { element: layers, width: data.layersWidth, showButtonLabel: "Show Layers", visible: true }
  };
}

/*
  Users
*/

export const Users: Present<I.UserSummaryEx[]> = (data: I.UserSummaryEx[]): Contents => {
  const users: React.ReactElement =
    <div className="all-users">
      {data.map(user => {
        const { userName, gravatar, key } = Summaries.getUserSummary(user, { title: false, small: false });
        const location = user.location ? <span className="user-location">{user.location}</span> : undefined;
        return (
          <div className="user-info" key={key}>
            {gravatar}
            <div className="details">
              {userName}
              {location}
            </div>
          </div>
        );
      })}
    </div>;
  return {
    main: users,
    width: "Grid"
  };
}
