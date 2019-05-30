This is forum/discussion software, written using React.js and TypeScript.

## See it, try it

A copy of this software is running at `https://url-to-be-supplied.example.com` --
where you can see how it behaves and what it looks like.

## Source code

I hope you like the source code:

- React seems to me to be a great way to write a whole application

  - Nice tools
    - VS Code's integration with TypeScript
    - Seamless integration between editing the source and browsing the result
  - Organize the implementation any way you like
  - Minimal overhead, no "framework" to learn to fit into
  - A wealth of 3rd-party components

  Also an adequate way to write a highly-interactive component

- Using it with TypeScript instead of JavaScript seems to me ideal -- for example,
  having TypeScript interfaces to define the format of data shared between components

  - Shared between client and server
  - Used in the APIs of any reusable/shared components
  
  Having strongly-typed code helps refactoring

All the source code exists in two subdirectories:

- [`/src`](./src)
- [`/prebuild_data`](./prebuild_data)

## Why

I write this because it's one thing to read about a tool, and another thing to use it to write something.

The React API documentation shows isolated components implemented using half-a-dozen lines of code --
whereas this let me experience:

- How to implement an application
  -- [`./src/react/App.tsx`](./src/react/App.tsx)
- How to implement something like a "master page template"
  -- i.e. where different pages may share similar but configurable, reusable layouts
- How to implement a highly interactive component
  -- [`./src/react/EditorTags.*`](./src/react/EDITORTAGS.md)
- How to implement a Single Page Application
  -- by including the data, and perhaps a "mock" version of the server, in the code that's run inside the browser.

The current size of this project is ...

```
C:\Users\Christopher\Source\Repos\react-forum\src>rots --ext .css .md .ts .tsx
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Language                Code       Comment         Blank         Lines         Files │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ CSS                      603            17           145           765             7 │
│ MarkDown                 294             0            93           387             6 │
│ TypeScript              1583           344           339          2266            29 │
│ TypeScript JSX          1662           393           325          2380            12 │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Total                   4142           754           902          5798            54 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

## No license

Copyright 2019 Christopher Wells

This software can not be copied and/or distributed without the express permission of Christopher Wells.

You may review this software on your computer and try it.

You may not:

- Transfer it to other people
- Modify it
- Use it on a live web site

Do contact me if you'd like to license or develop it further.

https://github.com/cwellsx/react-forum

## Change log

This software is unreleased or pre-release, so the formal [change log](./CHANGELOG.md) has not been started.

There is a [To Do](./TDODO.md) list, which lists some of the obvious features that are yet to be developed,
to make this a product instead of a React demo and a proof-of-concept.

## How to build

"This project was bootstrapped with Create React App" so see
the [CRA-README.md](./CRA-README.md) (renamed from `README.md`).
