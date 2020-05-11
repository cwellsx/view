import React from "react";
import { Link } from "react-router-dom";

// this uses the "html-to-react" package, to transform <a> in the HTML string to <Link> elements
// if we didn't need that transformation we could just do <div dangerouslySetInnerHTML={html} />

// [Whitespace text nodes cannot appear as a child of `<table>`](https://github.com/aknuds1/html-to-react/issues/79)
function trimHtml(html: string): string {
  // React expects no whitespace between table elements
  html = html.replace(/<table>\s*<thead>/g, "<table><thead>");
  html = html.replace(/<table>\s*<tbody>/g, "<table><tbody>");
  html = html.replace(/<thead>\s*<tr>/g, "<thead><tr>");
  html = html.replace(/<tbody>\s*<tr>/g, "<tbody><tr>");
  html = html.replace(/<tr>\s*<th>/g, "<tr><th>");
  html = html.replace(/<tr>\s*<td>/g, "<tr><td>");

  html = html.replace(/<\/thead>\s*<tbody>/g, "</thead><tbody>");

  html = html.replace(/<\/thead>\s*<\/table>/g, "</thead></table>");
  html = html.replace(/<\/tbody>\s*<\/table>/g, "</tbody></table>");
  html = html.replace(/<\/tr>\s*<\/thead>/g, "</tr></thead>");
  html = html.replace(/<\/tr>\s*<\/tbody>/g, "</tr></tbody>");
  html = html.replace(/<\/th>\s*<\/tr>/g, "</th></tr>");
  html = html.replace(/<\/td>\s*<\/tr>/g, "</td></tr>");

  html = html.replace(/<\/tr>\s*<tr>/g, "</tr><tr>");
  html = html.replace(/<\/th>\s*<th>/g, "</th><th>");
  html = html.replace(/<\/td>\s*<td>/g, "</td><td>");
  return html;
}

export function htmlToReact(html: string): React.ReactElement {
  html = trimHtml(html);
  // console.log(html);

  var { Parser, ProcessNodeDefinitions } = require("html-to-react");
  var parser = new Parser();
  var processNodeDefinitions = new ProcessNodeDefinitions(React);
  var isValidNode = function () {
    return true;
  };
  // these "node" values aren't DOM nodes, so I type them here as type "any"
  // `html-to-react` uses `htmlparser2` as its parser, which uses `domhandler` for its DOM,
  // which uses e.g. "parent" instead of "parentElement" as a property name.
  var processingInstructions = [
    {
      // Custom <a> processing
      shouldProcessNode: function (node: any) {
        return node.name === "a";
      },
      processNode: function (node: any, children: any) {
        var href = node.attribs["href"];
        return React.createElement(Link, { to: href }, children);
      },
    },
    {
      // Anything else
      shouldProcessNode: function (node: Node) {
        return true;
      },
      processNode: processNodeDefinitions.processDefaultNode,
    },
  ];
  var reactElement = parser.parseWithInstructions(`<div>${html}</div>`, isValidNode, processingInstructions);
  return reactElement;
}
