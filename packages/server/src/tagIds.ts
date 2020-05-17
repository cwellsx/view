import { BareTag, BareTagCount, getTagText, isTag, TagId } from "server-types";
import { IdName, Image, Key, SiteTagCount, TagCount, Url } from "shared-lib";

// export function getTagText(title: string) {
//   // preserve only alphanumeric and whitespace and hyphen, then convert all whitespace, then toLower
//   return slugify(title);
// }

function getMapKey(tagId: TagId): string {
  return isTag(tagId) ? tagId.tag : `${tagId.id} ${tagId.resourceType}`;
}

function getTagKey(key: string, images: IdName[]): string {
  if (!key.includes(" ")) {
    return key;
  }
  // do the reverse of what `add(tagId: TagId)` did, above
  const split = key.split(" ");
  const id: number = +split[0];
  if (!id) {
    // shouldn't happen
    console.error(`TagIdCounts.read -- unexpected key "${key}"`);
  } else {
    const resourceType: Url.ResourceType = split[1] as Url.ResourceType;
    switch (resourceType) {
      case "Image":
        const foundImage = images.find((idName) => idName.id === id);
        if (!foundImage) {
          // shouldn't happen -- was the image deleted or something?
          console.error(`TagIdCounts.read -- image not found "${key}"`);
          break;
        }
        key = getTagText(foundImage.name);
        break;
      default:
        // shouldn't happen -- are we meant to be implementing support for using another resourceType as a TagId?
        console.error(`TagIdCounts.read -- unexpected resourceType "${key}"`);
        break;
    }
  }
  return key;
}

// this class mimics a Map<TagId, TValue>
class TagIdMap<TValue> {
  private readonly images: IdName[];
  private readonly map: Map<string, TValue> = new Map<string, TValue>();
  constructor(images: IdName[]) {
    this.images = images;
  }

  protected get(key: string): TValue | undefined {
    return this.map.get(key);
  }
  protected set(key: string, value: TValue): void {
    this.map.set(key, value);
  }
  protected has(key: string): boolean {
    return this.map.has(key);
  }

  protected getKeyPairs(): (Key & { value: TValue })[] {
    const rc: (Key & { value: TValue })[] = [];
    this.map.forEach((value, key) => {
      key = getTagKey(key, this.images);
      rc.push({ key, value });
    });
    return rc;
  }
}

export class TagIdCounts extends TagIdMap<number> {
  add(tagId: TagId): void {
    // if this has a resource type then convert it to a string with an internal space (which a key can't have)
    const key = getMapKey(tagId);
    const count = super.get(key);
    super.set(key, count ? count + 1 : 1);
  }
  read(): BareTagCount[] {
    const rc: (Key & { value: number })[] = super.getKeyPairs();
    return rc.map((o) => {
      return { key: o.key, count: o.value };
    });
  }
}

export class TagIdDiscussions extends TagIdMap<number[]> {
  private readonly allTags: BareTag[];
  private readonly allImages: Image[];
  private readonly imageKeys: Map<number, string>;
  private readonly imageKeyIds: Map<string, number>;
  constructor(allImages: Image[], allTags: BareTag[]) {
    super(allImages);
    this.allTags = allTags;
    this.allImages = allImages;
    this.imageKeys = new Map<number, string>();
    this.imageKeyIds = new Map<string, number>();
    // if images are pre-loaded then pre-load the corresponding tagId
    for (const image of allImages) {
      const tagId: TagId = { id: image.id, resourceType: "Image" };
      if (!this.addTagId(tagId)) {
        throw new Error("duplicate image");
      }
      const key = getTagText(image.name);
      this.imageKeys.set(image.id, key);
      this.imageKeyIds.set(key, image.id);
    }
  }
  private addTagId(tagId: TagId): boolean {
    const key = getMapKey(tagId);
    if (super.has(key)) {
      return false;
    }
    super.set(key, []);
    return true;
  }
  addTag(tag: string): boolean {
    const tagId: TagId = { tag };
    return this.addTagId(tagId);
  }
  find(tag: string): TagId | undefined {
    const id = this.imageKeyIds.get(tag);
    const tagId: TagId = id ? { id, resourceType: "Image" } : { tag };
    const key = getMapKey(tagId);
    if (!super.has(key)) {
      return undefined;
    }
    return tagId;
  }
  // called from postNewDiscussion which has already verified that this TagId can be found
  addDiscussionId(tagId: TagId, discussionId: number) {
    const key = getMapKey(tagId);
    super.get(key)!.push(discussionId);
  }
  // called from getSiteMap which only wants tags (it sends images separately)
  siteTagCounts(): SiteTagCount[] {
    return this.allTags.map((tag: BareTag) => {
      const { title, key, summary } = tag;
      const count = super.get(getMapKey({ tag: key }))!.length;
      return { title, key, summary, count };
    });
  }
  // called from getAllTags which wants tags and images
  tagCounts(): TagCount[] {
    // same as siteTagCounts() except no title
    return this.allTags
      .map((tag: BareTag) => {
        const { key, summary } = tag;
        const count = super.get(getMapKey({ tag: key }))!.length;
        return { key, summary, count };
      })
      .concat(
        this.allImages.map((image) => {
          const { summary, id } = image;
          const tagId: TagId = { id, resourceType: "Image" };
          const count = super.get(getMapKey(tagId))!.length;
          const key = this.getKey(tagId).key;
          return { key, summary, count };
        })
      );
  }
  // called from various places
  // assumes the images exist but doesn't assume a tag exists
  // assumes that any TagId is valid i.e. that corresponding image exists
  getKey(tagId: TagId): Key {
    const key = isTag(tagId) ? tagId.tag : this.imageKeys.get(tagId.id)!;
    return { key };
  }
}

// https://titlecaseconverter.com/rules/
const titleCase: string[] = [
  "at",
  "by",
  "in",
  "of",
  "on",
  "up",
  "to",
  "but",
  "for",
  "off",
  "out",
  "via",
  "for",
  "and",
  "nor",
  "but",
  "or",
  "yet",
  "so",
];

// used when auto-adding a tag
export function simulateTitle(tag: string) {
  const words: string[] = tag.split("-");
  for (let i = 0; i < words.length; ++i) {
    const word = words[i];
    if (!titleCase.includes(word)) {
      words[i] = word.substring(0, 1).toLocaleUpperCase() + word.substring(1);
    }
  }
  return words.join(" ");
}
