import { ResourceType } from "../shared/request";
import { TagId, isTagIdKey, getTagText, BareTagCount } from "./bare";
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
  add(tagId: TagId): void {
    // if this has a resource type then convert it to a string with an internal space (which a key can't have)
    const key = isTagIdKey(tagId) ? tagId.key : `${tagId.what.id} ${tagId.resourceType}`;
    const count = this.map.get(key);
    this.map.set(key, count ? count + 1 : 1);
  }
  read(images: IdName[]): BareTagCount[] {
    const rc: BareTagCount[] = [];
    this.map.forEach((value, key) => {
      if (key.includes(" ")) {
        // do the reverse of what `add(tagId: TagId)` did, above
        const split = key.split(" ");
        const id: number = +split[0];
        if (!id) {
          // shouldn't happen
          console.error(`TagIdCounts.read -- unexpected key "${key}"`);
          return;
        }
        const resourceType: ResourceType = split[1] as ResourceType;
        switch (resourceType) {
          case "Image":
            const foundImage = images.find(idName => idName.id === id);
            if (!foundImage) {
              // shouldn't happen -- was the image deleted or something?
              console.error(`TagIdCounts.read -- image not found "${key}"`);
              return;
            }
            key = getTagText(foundImage.name);
            break;
          default:
            // shouldn't happen -- are we meant to be implementing support for using another resourceType as a TagId?
            console.error(`TagIdCounts.read -- unexpected resourceType "${key}"`);
            return;
        }

      }
      rc.push({ key, count: value });

    });
    // return unsorted -- let the client sort it however it wants
    return rc;
  }
}

