import { Data } from 'client/src';
import React from 'react';

import { FetchedT, Layout } from '../layouts';

export function showImage(fetched: FetchedT<Data.Image, void>): Layout {
  const { data } = fetched;
  const images = (
    <div className="image-images">
      <img src={data.image.src} height={data.image.height} width={data.image.width} alt="" />
    </div>
  );
  const right = !data.layers
    ? undefined
    : {
        element: renderLayers(data.layers, 0),
        width: data.layersWidth,
        showButtonLabel: "Show Layers",
        visible: true,
      };
  return {
    main: { content: images, title: data.name },
    width: "Full",
    right,
  };
}
function getLayerKey(layer: Data.LayerNode): string {
  return layer.alias ? layer.alias : layer.name.toLowerCase().replace("&", "and").replace(" ", "-");
}

function handleLayerChange(event: React.ChangeEvent<HTMLInputElement>) {
  const target = event.target;
  const alias: string | null = target.getAttribute("name");
  const checked: boolean = target.checked;
  alert(`In the non-prototype this would ${checked ? "show" : "hide"} the '${alias}' image layer`);
}

function renderNode(node: Data.LayerNode, alias: string): React.ReactElement {
  // https://stackoverflow.com/questions/26615779/react-checkbox-not-sending-onchange
  return (
    <label>
      <input type="checkbox" defaultChecked={true} onChange={handleLayerChange} name={alias} />
      {node.name}
    </label>
  );
}

function renderLayers(layers: Data.ImageLayers, level: number): React.ReactElement {
  const className = level === 0 ? "image-layers" : undefined;
  const listItems = layers.map((node) => {
    const alias = getLayerKey(node);
    return (
      <li key={alias} className={node.children ? "parent" : undefined}>
        {renderNode(node, alias)}
        {node.children && renderLayers(node.children, level + 1)}
      </li>
    );
  });
  return <ul className={className}>{listItems}</ul>;
}
