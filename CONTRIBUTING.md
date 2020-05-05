## No modification

This software is copyright, and is not licensed for modification -- see the [LICENSE](./LICENSE.md).

Please  contact me if you'd like to develop it further --
cwellsx@gmail.com

## Development environment setup

### Prettier

I have "Prettier" as a VS Code plug-in, configured to run when a file is saved -- please do the same:

- In VS Code, install the "Prettier" VS Code plug-in
- Go to "File > Preferences > Settings" and change the "Prettier Print Width" value to `120` (the default value is `80`).

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

## Project configuration

The project configuration is based on `monorepo-demo` --
for more details see [Creating the repo](MONOREPO.md#creating-the-repo).

After you get it from GitHub, run `yarn install` and `yarn build` before you try to run it.

## Temporary bug and its work-Around

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

---

To do: https://mozillascience.github.io/working-open-workshop/contributing/