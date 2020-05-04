// https://github.com/mmillican/pagedown/blob/master/README.md

// it's JavaScript with no TypeScript declarations
var pagedown: any = require("pagedown");
var converter = new pagedown.getSanitizingConverter(); // instead of just new pagedown.Converter();

// return type matches what can be passed as a parameter to React elements' dangerouslySetInnerHTML property.
export function toHtml(markdown: string): { __html: string } {
  const __html = converter.makeHtml(markdown);
  return { __html };
}
