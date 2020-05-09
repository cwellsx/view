## No modification

This software is copyright, and is not licensed for modification -- see the [LICENSE](./LICENSE.md).

Please contact me if you'd like to develop it further --
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
for more details see [Creating the repo](MONOREPO.md#creating-the-repo).

After you get it from GitHub, run `yarn install` and `yarn build` before you try to run it.

## Temporary bug and its work-around

The `yarn watch` command doesn't work on my machine --
it works correctly in the `monorepo-demo` project, but on my machine it hangs after displaying this message:

```
app-react: Starting the development server...
shared-lib: 11:50:53 PM - Found 0 errors. Watching for file changes.
```

IMO the `package.json` files are the same --
and the difference is that this project uses a newer version of `create-react-apps`, and a newer version of TypeScript, for no important reason.

I think that's caused by this bug -- https://github.com/facebook/create-react-app/pull/8700 -- whose fix was merged into master two days ago and is not yet released.

I could revert to an earlier version while waiting for the fix, but won't -- will instead update `create-react-apps` when a fix is released.

The temporary work-around, instead of running `yarn watch`, is to run `yarn watch-lib` and `yarn watch-ui` in two different command windows.

## Watch during development

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

## Running in a subdirectory

The production build is run in a subdirectory i.e. `https://cwellsx.github.io/views`

The development build is run in a root directory i.e. `http://localhost:3000/`

Normally to let the production build run in a subdirectory the following configuration is required.

- In `package.json`:

  ```
  "homepage": "https://cwellsx.github.io/views"
  ```

- In `App.tsx`:

  ```
  <ReactRouter.BrowserRouter basename={process.env.PUBLIC_URL}>
  ```

However this breaks the development build (because `PUBLIC_URL` is set to `/views` in the development build).
So -- instead of setting the `homepage` in `package.json` -- there are two environment files which are described in
[Adding Custom Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

- `.env.development` is used by `yarn watch`
- `.env.production` is used by `yarn build`

## Coding style

### File names

This project uses the following file naming conventions:

- `lower_case` for directory names, to match `node_modules`
- `PascalCase` for React scripts, because that seems to be standard for React
- `camelCase` for other files, especially TypeScript source files
- `UPPERCASE` for Markdown files (e.g. `README.md`)
- 3rd-party image files in the `/src/icons` folder preserve their original filenames

### Functions instead of classes

Many of the interfaces (e.g. defined in `/src/data`) define data sent over the network in JSON format.
They therefore only define data, and no functions (no methods).
So the coding style tends towards interfaces which define simple data types, plus functions --
that is, instead of TypeScript classes.

The React scripts too are coded using React's new-style "Functional components" -- with "Hooks" -- instead of "Class components".

---

To do: https://mozillascience.github.io/working-open-workshop/contributing/
