## No modification

This software is copyright, and is not licensed for modification -- see the [LICENSE](./LICENSE.md).

Please  contact me if you'd like to develop it further --
cwellsx@gmail.com

## Environment

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
cannot be installed as a depedency of this project, because it's
used to delete all this project's dependencies,
so instead install it globally:

    npm install rimraf -g

---

To do: https://mozillascience.github.io/working-open-workshop/contributing/