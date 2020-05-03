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