This `src` directory contains all (and only)
the content which is rendered in the browser.

See also the [`/server`](../server) directory, which contains
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
  <td>index.tsx</td>
</tr>

<tr>
  <td><code>./react</code></td>
  <td>Content defined in React scripts:
    <ul>
      <li><code>*.tsx</code> (scripts)</li>
      <li><code>*.css</code> (stylesheets)</li>
      <li><code>*.tsx</code> (icons)</li>
    </ul>
  </td>
</tr>

<tr>
  <td><code>./data</code></td>
  <td>TypeScript interfaces:
    <ul>
      <li>Data is requested and consumed by React scripts</li>
      <li>These interfaces declare the format of the data</li>
      <li>These interfaces are shared with (i.e. they're also imported and used by) modules in the
      <a href="../server"><code>/server</code></a> directory</li>
    </ul>
    <p>The server also imports interfaces declared in the
    <a href="./io/post.ts"><code>./io/post</code></a> and
    <a href="./io/push.ts"><code>./io/push</code></a> modules.</p>
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

</table>