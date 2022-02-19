// const express = require("express");
import express from "express";
import { getHtml } from "./getHtml";
const favicon = require("express-favicon");

const path = require("path");
const port = process.env.PORT || 8080;
const app = express();
app.use(favicon(__dirname + "/build/favicon.ico"));
// the __dirname is the current directory from where the script is running
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "build")));
app.get("/ping", function (req, res) {
  return res.send("pong");
});
app.get("/*", getHtml);
console.log(`Listening on ${port}`);
app.listen(port);
