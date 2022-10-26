This is what is called a "monorepo" -- several projects/packages are contained in this one repository.

For more information, search the web using words like "`monorepo`", "`lerna`", "`yarn workspace`".

## How I initially created the repo

I used the following commands to create the initial repo.

- `git init`
- `yarn init` (including `"private": true`)
- `lerna init`
- Edit [`lerna.json`](./lerna.json) to add
  ```
  "npmClient": "yarn",
  "useWorkspaces": true`
  ```
- Edit [`package.json`](./package.json) to add
  ```
  "private": true,
  "workspaces": [
    "packages/*"
  ]
  ```
- `lerna import` to import an existing monolithic CRA repository

  Other sites (see for example
  [here](https://github.com/facebook/create-react-app/issues/1333#issuecomment-384978840))
  warn than running `create-react-app` within a monorepo
  would interfere with the monorepo's hoisting.

- Edit [`package.json`](./package.json) to add `scripts`,
  which are implemented using `lerna run`,
  which invoke scripts either in all packages or scoped to specific packages.

  Packages are [automatically built](https://github.com/lerna/lerna/issues/1689#issuecomment-426090119) in correct order based on their dependencies:

  > `lerna bootstrap`, `lerna exec`, `lerna run`, and `lerna` publish all operate on packages in batched topological order (all dependents before dependencies) by default. To disable this topological sorting, you can pass `--no-sort` (though honestly I don't know why you would in 98% of cases).

- Create a new, empty package for a TypeScript project in the `packages` folder.

  - `yarn init`
  - `yarn add typescript --dev`
  - `yarn tsc --init`
  - `yarn init`

  All projects should ideally have similar:

  - TypeScript compiler version
  - Directory structure
  - `package.json` and `tsconfig.json` options

  Having identical TypeScript versions shouldn't matter at build time, but might be safer -- currently all projects use `^3.8.0` which is the latest version.

Some example projects to imitate:

- [React + TypeScript Monorepo Demo](https://juliangaramendy.dev/monorepo-demo/)
- [TypeScript monorepo for React project](https://dev.to/stereobooster/typescript-monorepo-for-react-project-3cpa) and https://github.com/stereobooster/typescript-monorepo
- https://github.com/biernacki/cra-monorepo
- [Monorepos: Lerna, TypeScript, CRA and Storybook combined](https://dev.to/shnydercom/monorepos-lerna-typescript-cra-and-storybook-combined-4hli) and https://github.com/shnydercom/lerna-typescript-cra-uilib-starter/tree/master/packages

The configuration of this repo is based on the first of these i.e. `monorepo-demo`.

## Project references

TODO -- Building might be faster if it were configured to use Project references or incremental compilation:

- https://www.google.com/search?q=typescript+monorepo+project+references
- https://medium.com/@NiGhTTraX/how-to-set-up-a-typescript-monorepo-with-lerna-c6acda7d4559
- https://github.com/NiGhTTraX/ts-monorepo
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html
- https://www.typescriptlang.org/docs/handbook/project-references.html

## Better integration with Create React App

There's an outstanding CRA issue:
[Support Lerna and/or Yarn Workspaces - Issue #1333](https://github.com/facebook/create-react-app/issues/1333)

My first attempt (above) was mostly successful:

- Component packages are built separately/previously
- Component packages are then available to and included into the CRA app, just like any other dependency would be in `node_modules`

Unfortunately I found that, when I debugged the CRA app, the debugger
couldn't set breakpoints in nor properly step into the TypeScript in component packages.
That might (I'm not sure) be because WebPack is transpiling
the `node_modules` which makes their source maps out of date.

So I looked for another way to do this and found it here:

- https://github.com/minheq/monorepo-cra-source-map

The steps are:

- Define `module` fields in `package.json` to point to the uncompiled `*.ts` files

  See also [What is the “module” package.json field for?](https://stackoverflow.com/questions/42708484/what-is-the-module-package-json-field-for)

- Override [this line in `webpack.config.js`](https://github.com/facebook/create-react-app/blob/fa648daca1dedd97aec4fa3bae8752c4dcf37e6f/packages/react-scripts/config/webpack.config.js#L399) ...

  ```
  include: paths.appSrc,
  ```

  ... to make it, instead of one path, an array of all the paths which webpack should be willing to transpile.

The are various ways to implement the change to `webpack.config.js`:

- Using `craco`

  https://github.com/facebook/create-react-app/issues/1333#issuecomment-587415796

- Using `customize-cra`:

  https://github.com/facebook/create-react-app/issues/1333#issuecomment-593667643

- Using `react-app-rewired`:

  https://github.com/viewstools/yarn-workspaces-cra-crna  
  https://github.com/viewstools/yarn-workspaces-cra-crna/blob/master/react-app-rewire-yarn-workspaces/index.js

- Forking the whole `create-react-app` repository:

  https://github.com/bradfordlemley/create-react-app

Anyway I did it using `react-app-rewired` as described in
https://github.com/minheq/monorepo-cra-source-map

I needed to do something else as well: because the TypeScript source is in a `src` subdirectory
I had to change the `import` statements in the app to import from
`client\src` instead of from `client`.
Ideally I should have been able to, instead, fix this with
`baseUrl` and `paths` in the `tsconfig.json` however these
are not supported by CRA.

Given this new method it's sufficient to run `yarn build` in the `ui-react` project --
its build will now also build all its dependencies.
It's no longer necessary to build or pre-build the dependencies explicitly.

The commit which implements this change is https://github.com/cwellsx/view/commit/8d046d9

## Package names

In theory the packages names might be scoped, with names like `@monorepo/ui-react` or `@cwellsx/ui-react`.

In fact the packages are not for reuse in other projects outside this monorepo,
so they will not be uploaded to npmjs.com -- and so it doesn't matter that the package names
may conflict with some already-published package.

If this is changed in future to add a scope, beware that various configuration files and script parameters sometimes need a package name, sometimes a directory name.
