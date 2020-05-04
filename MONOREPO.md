This is what is called a "monorepo".
Several projects/packages are contained in this one repository.

For more information, search the internet for the following terms: "monorepo", "lerna", "yarn workspace".

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
  
  ## Package names

  In theory the packages names might be scoped, with names like `@monorepo/ui-react` or `@cwellsx/ui-react`.

  In fact the packages are not for reuse in other projects outside this monorepo,
  so they will not be uploaded to npmjs.com -- and so it doesn't matter that the package names
  may conflict with some already-published package.
