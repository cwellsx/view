import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { Api, Url, Data } from "client";
import { useFetchApi2, FetchingT } from "../hooks";
import { getPage, FetchedT, ShowDataT } from "../layouts";
import { Layout } from "../PageLayout";
import { notFound } from "./NotFound";

export const Image: React.FunctionComponent<RouteComponentProps> = (props: RouteComponentProps) => {
  const parsed = Url.isImage(props.location);
  if (Url.isParserError(parsed)) {
    return notFound(props, parsed.error);
  }

  // see https://stackoverflow.com/questions/55990985/is-this-a-safe-way-to-avoid-did-you-accidentally-call-a-react-hook
  // I'm not sure whether or why it's necessary to instantiate it like `<ImageId />` instead
  // of calling it as a function like `ImageId({imageId: imageId})` but I do it anyway.
  // So far as I can tell from testing, what really matters is the array of dependencies passed to useEffects.
  return <ImageId id={parsed.id} name={parsed.name} />;
};

const ImageId: React.FunctionComponent<Data.IdName> = (props: Data.IdName) => {
  // ImageId is a separate function component because there's an `if` statement at the top of the Image cmpnent
  // https://overreacted.io/a-complete-guide-to-useeffect/#but-i-cant-put-this-function-inside-an-effect

  const { id, name } = props;
  const idName = React.useMemo<Data.IdName>(() => {
    return { id, name };
  }, [id, name]);

  return getPage(useFetchApi2(Api.getImage, idName), showImage);
};

function showImage(fetched: FetchedT<Data.Image, void>): Layout {
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
