This is forum/discussion software, written using React.js and TypeScript.

## Demo

This software is running at https://react-forum2.herokuapp.com/discussions

Try that to see how it behaves, and what it looks like.

## Why

I wrote this project to see how to design and write an application using React.

The React API documentation shows mostly small code examples,
each a half-a-dozen lines of code -- this larger project shows some example of how to implement:

- An application
  -- [`./src/react/App.tsx`](./src/react/App.tsx)
- Something like a "master page template"
  -- i.e. where different pages share similar layouts with different content
- A very interactive component
  -- [`./src/react/EditorTags.*`](./src/react/EDITORTAGS.md)
- A Single Page Application
  -- by including the data, and perhaps a "mock" version of the server, in the code that's run inside the browser.

In summary, React seems like a good way to write an application:

- Nice tools -- including seamless integration between editing the source and browsing the result,
and, VS Code's integration with TypeScript
- Organize the implementation, into modules, any way you like
- Minimal overhead, no "framework" to learn to fit into
- A wealth of 3rd-party components

It also seems an adequate way to write some highly-interactive components.

Using it with TypeScript also seems ideal -- for example,
using TypeScript interfaces to define the format of data shared  between client and server,
and used in the APIs of any reusable/shared components.
Having strong types helps with refactoring too.

The source code all exists in two subdirectories:

- [`/src`](./src)
- [`/prebuild_data`](./prebuild_data)

## No license

Copyright 2019 Christopher Wells

This software can not be copied and/or distributed without the express permission of Christopher Wells.

You may review this software on your computer and try it.

You may not:

- Transfer it to other people
- Modify it
- Use it on a live web site

Do contact me if you'd like to develop it further.

https://github.com/cwellsx/react-forum

## Change log

This software is unreleased or pre-release, so the formal [change log](./CHANGELOG.md) has not been started.

There is a [To Do](./TODO.md) list, which lists some of the obvious features that are yet to be developed,
to make this a product instead of a React demo and a proof-of-concept.

## How to build

"This project was bootstrapped with Create React App" so see
the [CRA-README.md](./CRA-README.md) (renamed from `README.md`).

## Integration with Express and Heroku

I did the minimum necessary to integrate with express:

- Create a `server.js` which serves what is in the `build` directory
- Add a new script named `express` to `package.json`
- Added a script named `heroku-postbuild` (which runs the existing `prebuild-data` script)

The express server can therefore be started by running the following scripts:

```
yarn build
yarn express
```

I also defined a `Procfile` -- see Heroku's
[Specifying a start script](https://devcenter.heroku.com/articles/deploying-nodejs#specifying-a-start-script).
