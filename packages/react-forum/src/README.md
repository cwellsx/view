This `src` directory contains all (and only)
the content which is rendered in the browser.

See also the as-yet-non-existent [`/server`](../server) directory, which contains
the content which is only executed on the server.

This `src` directory includes the following subdirectories.

<table>

<thead>
<tr>
<th>Where</th>
<th>What</th>
</tr>
</thead>

<tr>
  <td><code>./</code></td>
  <td><code>index.tsx</code> does little except render the <code>/src/react/App.tsx</code> script.
  <p>It also imports <code>normalize.css</code>.</p>
  </td>
</tr>

<tr>
  <td><code>./react</code></td>
  <td>Content defined in React scripts:
    <ul>
      <li><code>*.tsx</code> (scripts)</li>
      <li><code>*.css</code> (stylesheets)</li>
    </ul>
    <p>The top-most script is <code>App.tsx</code> which defines the "routes",
    i.e. how to render (and fetch data for) each type of URL.</p>
    <p>The application uses the "React Router" module, so it behaves like a single-page application (SPA).</p>
  </td>
</tr>

<tr>
  <td><code>./icons</code></td>
  <td>Images included in React scripts:
    <ul>
      <li><code>*.svg</code> (graphics)</li>
    </ul>
  </td>
</tr>

<tr>
  <td><code>./io</code></td>
  <td>TypeScript helper module:
    <ul>
      <li>Abstracts the I/O between the React scripts and the server</li>
      <li>Is a type-safe wrapper, which returns strongly-typed data</li>
      <li>Can also act as a mock server when prototyping the UI</li>
    </ul>
  </td>
</tr>


<tr>
<td colspan="2">
The directories listed above define code which only runs in the client-side browser.
<p>
The directories listed below define code which is shared (used) by the client-side and the server-side.
</p>
</td>
</tr>

<tr>
  <td><code>./data</code></td>
  <td>TypeScript interfaces:
    <ul>
      <li>Data is requested and consumed by React scripts</li>
      <li>These interfaces declare the format of the data</li>
      <li>These interfaces are shared with (i.e. they're also imported and used by) modules in the
      <a href="./server"><code>./server</code></a> directory</li>
    </ul>
    <p>The server also imports interfaces declared in the
    <a href="./io/post.ts"><code>./io/post</code></a> and
    <a href="./io/push.ts"><code>./io/push</code></a> modules.</p>
  </td>
</tr>

<tr>
  <td><code>./shared</code></td>
  <td>TypeScript helper module:
    <ul>
      <li>Contains code (and data) which is shared (i.e. used) by both the server- and the client-side</li>
      <li>Includes:
      <ul>
        <li>The <code>PageId</code> class which defines the URLs</li>
        <li>Classes which define the format of data on the wire</li>
      </ul></li>
      <li>This and the <code>./data</code> directory are the only directories shared between the client and the server</li>
    </ul>
  </td>
</tr>


<tr>
<td colspan="2">
The directories listed above define everything which runs in the client-side browser.
<p>
The directories listed below define everything which runs on the server-side.
</p>
<p>
These server-side directories are subdirectories of <code>/src</code> so that they can also --
instead of being run on the server -- be run on the client-side inside the browser.
</p>
<p>
This is so that the client-side application can act as a stand-alone demo when it's run without a server --
then it "communicates" with server-side code and data which is bundled to run inside the browser.
</p>
</td>
</tr>

<tr>
  <td><code>./server_data</code></td>
  <td>JSON files which define the initial server-side data:
    <ul>
      <li>Sample data is created by scripts in the <code>/prebuild_data</code> directory</li>
      <li>Data is loaded into the server by the <code>./server/loader</code> module</li>
    </ul>
  </td>
</tr>

<tr>
  <td><code>./server</code></td>
  <td>TypeScript code which implements the server-side functionality:
    <ul>
      <li>Loads data from the <code>/prebuild_data</code> directory</li>
      <li>Responds to GET and POST requests which it receives from the client-side <code>./io</code> module</li>
    </ul>
  </td>
</tr>

</table>

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
