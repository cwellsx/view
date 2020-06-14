## No modification

This software is copyright, and is not licensed for modification -- see the [LICENSE](./LICENSE.md).

Contact me if you want to develop it further --
cwellsx@gmail.com

## Development environment setup

### Prettier

I have "Prettier" as a VS Code plug-in -- please do the same.

The workspace option configured to run when a file is saved:
[`.vscode/settings.json`](.vscode/settings.json).

Or install Prettier on the command-line and run it before a commit:

    prettier --write --print-width 120 .

### rimraf

A script like this...

    "clean": "lerna run clean && rm -rf node_modules"

... would not be cross-platform.

So instead that script is written dependent on `rimraf` -- which
cannot be installed as a dependency of this project, because it's
used to delete all this project's dependencies,
so instead install it globally:

    npm install rimraf -g

### Debugging

I followed these instructions --
[Live edit and debug your React apps directly from VS Code — without leaving the editor](https://medium.com/@auchenberg/live-edit-and-debug-your-react-apps-directly-from-vs-code-without-leaving-the-editor-3da489ed905f) --
to enable debugging in VS code:

- Install Microsoft's `VS Code - Debugger for Chrome`
- Start the app using `yarn watch-ui`
- Press `F5` within VS Code

There are also `React Developer Tools` available on the chrome web store to improve inspection of React within Chrome.

## Project configuration

The project configuration is based on `monorepo-demo` --
for more details see:

- [How I initially created the repo](MONOREPO.md#how-i-initially-created-the-repo)
- [Better integration with Create React App](MONOREPO.md#better-integration-with-create-react-app).

After you get it from GitHub, run `yarn install` and `yarn build` before you try to run it.

## Watch during development

With this project you get the usual CRA dev experience, i.e. as follows.

When the watch is running:

- The compiled UI is visible in a browser window
- Editing source in the UI package will cause the browser to reload
- Ditto editing source in a required package
- If there's a compiler error then it's displayed (instead of the UI) in the browser window

Whether or not the watch is running:

- Compiler errors are highlighted in the IDE -- but only for source files which are open in the IDE editor
- This is normal behaviour of VS Code and TypeScript -- see for example
  [How to get VSCode to show TypeScript errors for files _not_ open in the editor?](https://stackoverflow.com/q/55201424/49942).
- If you don't like that there may be a work-around in some of the comments to
  [Feature Request: Show all errors and warnings in project for all files, not just opened ones](https://github.com/microsoft/vscode/issues/13953).

## Build environments

The software is built in at least a couple of different ways.

- The released build is deployed to be served from [`https://cwellsx.github.io/views`](https://cwellsx.github.io/views)
- The test/development build is run in a root directory i.e. `http://localhost:3000/`

The usual way to build to run from a subdirectory like `/views` would be to configure it as follows:

- In `package.json`:

  ```
  "homepage": "https://cwellsx.github.io/views"
  ```

- In `App.tsx`:

  ```
  <ReactRouter.BrowserRouter basename={process.env.PUBLIC_URL}>
  ```

However doing it in this way would break the development build
(because `PUBLIC_URL` would be set to `/views` in the development build, whereas instead it needs to be empty).

So we need a way to configure different builds -- and that way is to use environment variables.
So -- instead of setting the `homepage` in `package.json` -- there are two environment files which are described in
[Adding Custom Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

- [`.env.development`](./packages/ui-react/.env.development) is used by `yarn watch`
- [`.env.production`](./packages/ui-react/.env.production) is used by `yarn build`

## Coding style

### File names

This project uses the following file naming conventions:

- `lower_case` for directory names, to match `node_modules`
- `hyphenated-names` for package names
- `PascalCase` for React scripts, because that seems to be standard for React
- `camelCase` for other files, especially TypeScript source files
- `UPPERCASE` for Markdown files (e.g. `README.md`)
- 3rd-party image files in the `/ui-assets/icons` folder preserve their original filenames

### Functions and interfaces instead of classes

Many of the interfaces (e.g. defined in `/src/data`) define data sent over the network in JSON format.
They therefore only define data, and no functions (no methods).
So the coding style tends towards interfaces which define simple data types, plus functions --
that is, instead of TypeScript classes.

The React scripts too are coded using React's new-style "Functional components" -- with "Hooks" -- instead of using "Class components".

---

To do: https://mozillascience.github.io/working-open-workshop/contributing/
