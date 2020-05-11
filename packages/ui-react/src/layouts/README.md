This module renders content into a page layout (e.g. into one or more columns of various widths):

- The `Layout` interface defines/contains the content to be laid out (and identifies which layout to use).
- Functions in the `routes` module create instances of `Layout`, and pass them to the `renderLayout` method.
