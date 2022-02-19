// https://annacoding.com/article/5I7om6mCrW25KeA4ObeyMJ/Two-ways-to-solve:-Cannot-find-SVG-module-error-when-compiling-Typescript-in-React-application

// declare module "*.svg" {
//   const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
//   export default content;
// }

// https://duncanleung.com/typescript-module-declearation-svg-img-assets/

declare module "\*.svg" {
  import React = require("react");
  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
