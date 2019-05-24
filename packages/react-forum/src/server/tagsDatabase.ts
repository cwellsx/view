import { ResourceType } from "../shared/request";
import { TagId, isTagIdKey, getTagIdText } from "../data/tag";
import { IdName } from "../data/id";

/*
  Class in which to count each TagId per user

  This is more complicated than it might be because,as an extended feature,
  TagId might be Tag or it might be a reference to another resource.

  If we only supported Tag and not TagId then this whole class might be replaced by a simple Map<string, number> --
  the logic in this class is to serialize a TagId to a string which can be used as the key of a Map in the `add` method,
  and in the `read`1` methd to deserialise a string back to a TagId.
*/

export class TagIdCounts {
  readonly map: Map<string, number> = new Map<string, number>();
  cnstructor() { }
  add(tag: TagId): void {
    // leading " " ensures it can't overlap with a key, which is trimmed
    const key = isTagIdKey(tag) ? tag.key : ` ${tag.resourceType}-${tag.what.id}`;
    const count = this.map.get(key);
    this.map.set(key, count ? count + 1 : 1);
  }
  read(images: IdName[]): [TagId, number][] {
    const rc: [TagId, number][] = [];
    this.map.forEach((value, key) => {
      if (key[0] !== " ") {
        rc.push([{ key }, value]);
      } else {
        const tag = TagIdCounts.getTag(key, images);
        rc.push([tag, value]);
      }
    });
    rc.sort((x, y) => getTagIdText(x[0]).localeCompare(getTagIdText(y[0])));
    return rc;
  }
  static getTag(key: string, images: IdName[]): TagId {
    if (key[0] !== " ") {
      return { key };
    } else {
      const split = key.substring(1).split("-");
      const resourceType: ResourceType = split[0] as ResourceType;
      const id: number = +split[1];

      const getName = (resourceType: ResourceType, id: number): string => {
        switch (resourceType) {
          case "Image":
            const foundImage = images.find(idName => idName.id === id);
            return (foundImage) ? foundImage.name : `?image#${id}`;
          default:
            break;
        }
        // optionally alter this in future to support using other resource types as tagIds
        return `${resourceType}-${id}`;
      }

      const name = getName(resourceType, id);
      return { resourceType, what: { id, name } };
    }
  }
}

