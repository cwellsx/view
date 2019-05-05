// each node is a string (i.e. has a name) plus optional children (i.. has sub-layers)
// can't do this because typescript complains "Type alias 'LayerNode' circularly references itself.ts(2456)" 
// type LayerNode = [string, LayerNode[]];
export type LayerNode = {
  name: string,
  alias?: string,
  children?: LayerNode[]
}

export type ImageLayers = LayerNode[];