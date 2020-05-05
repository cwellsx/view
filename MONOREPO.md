This is what is called a "monorepo".
Several projects/packages are contained in this one repository.

For more information, search the web using words like "monorepo", "lerna", "yarn workspace".

## Creating the repo

I used the following commands to create the initial repo.

- `git init`
- `yarn init` (including `"private": true')
- `lerna init`
- Edit [lerna.json](./lerna.json) to add
  ```
  "npmClient": "yarn",
  "useWorkspaces": true`
  ```
- Edit [package.json](./package.json) to add
  ```
  "private": true,
  "workspaces": [
    "packages/*"
  ]
  ```
- `lerna import` to import an existing monolithic repository
- Edit [package.json](./package.json) to add `scripts`,
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

  Perhaps having identical TypeScript versions shouldn't matter at build time, but might be safer.
  I'm using `~3.7.2` because that's the version specified by create-react-app
  instead of `^3.8.3` which is the latest version.

  Some example projects to imitate:

  - [React + TypeScript Monorepo Demo](https://juliangaramendy.dev/monorepo-demo/)
  - [TypeScript monorepo for React project](https://dev.to/stereobooster/typescript-monorepo-for-react-project-3cpa) and https://github.com/stereobooster/typescript-monorepo
  - https://github.com/biernacki/cra-monorepo
  - [Monorepos: Lerna, TypeScript, CRA and Storybook combined](https://dev.to/shnydercom/monorepos-lerna-typescript-cra-and-storybook-combined-4hli) and https://github.com/shnydercom/lerna-typescript-cra-uilib-starter/tree/master/packages

## Package names

In theory the packages names might be scoped, with names like `@monorepo/ui-react` or `@cwellsx/ui-react`.

In fact the packages are not for reuse in other projects outside this monorepo,
so they will not be uploaded to npmjs.com -- and so it doesn't matter that the package names
may conflict with some already-published package.

If this is changed in future to add a scope, beware that various configuration files and script parameters sometimes need a package name, sometimes a directory name.
