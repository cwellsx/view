// each node is a string (i.e. has a name) plus optional children (i.. has sub-layers)

// we define it this way rather than as follows ...
//     type LayerNode = [string, LayerNode[]];
// ... to avoid typescript error "Type alias 'LayerNode' circularly references itself.ts(2456)" 

export type LayerNode = {
  name: string,
  alias?: string,
  children?: LayerNode[]
}

export type ImageLayers = LayerNode[];
