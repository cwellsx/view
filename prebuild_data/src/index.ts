import * as path from "path";
import * as fs from "fs";
import { readImages } from "./readImages";
import { readTopics } from "./readTopics";
import { readDiscussions } from "./readDiscussions";
import * as I from "../../src/data";

/*
  This reads data from the `/prebuild_data/data` folders
  and writes it as `*.json` or `*.ts` to the `/src/server-data` folder.

  `/prebuild_data/data/*.alt` folders can contain site-specific content
  they're not formally or by default part of this project and they're not
  included in this project's version control (they're in `.gitignore`).
*/

// helper functions

function getInputDir(dirName: string): string {
  const root = path.join(__dirname, "../data");
  const alt: string = path.join(root, dirName + ".alt");
  if (fs.existsSync(alt)) {
    return alt;
  }
  const rc: string = path.join(root, dirName);
  if (fs.existsSync(rc)) {
    return rc;
  }
  throw new Error(`Input directory ${rc} doesn't exist`);
}

const rootOutputDir = path.join(__dirname, "../../src/server_data");

function getOutputFile(fileName: string, ext = ".json"): string {
  if (!fs.existsSync(rootOutputDir)) {
    throw new Error(`Output directory ${rootOutputDir} doesn't exist`);
  }
  return path.join(rootOutputDir, fileName + ext);
}

function writeJson(o: object, outputFile: string): void {
  const json = JSON.stringify(o, null, 2);
  fs.writeFileSync(outputFile, json, "utf8");
}

// images

const inputImages = getInputDir("images");
const outputImages = getOutputFile("images", ".ts");
readImages(inputImages, outputImages, rootOutputDir);

// topics

const inputTopics = path.join(getInputDir("topics"), "topics.txt");
const outputTopics = getOutputFile("topics");
const outputFeaures = getOutputFile("features");
const topics: string[] = readTopics(fs.readFileSync(inputTopics, "utf8"));
const features: I.FeatureSummary[] = topics.map((value, index) => {
  return { idName: { id: index, name: value } };
});
writeJson(topics, outputTopics);
writeJson(features, outputFeaures);

// users

const inputUsers = path.join(getInputDir("users"), "users.json");
const outputUsers = getOutputFile("users");
const users = JSON.parse(fs.readFileSync(inputUsers, "utf8"));
writeJson(users, outputUsers);

// discussions

const inputDiscussions = path.join(getInputDir("discussions"), "random.txt");
const outputDiscussions = getOutputFile("discussions");
const discussions = readDiscussions(fs.readFileSync(inputDiscussions, "utf8"), users.length, features);
writeJson(discussions, outputDiscussions);
