import * as path from "path";
import * as fs from "fs";
import { readImages } from "./readImages";
import { readTopicTitles } from "./readTopicTitles";
import { readTopics, addSummaries } from "./readTopics";
import { readDiscussions } from "./readDiscussions";
import { BareTopic, getTagText } from "../../src/server/bare";

/*
  This reads data from the `/prebuild_data/data` folders
  and writes it as `*.json` or `*.ts` to the `/src/server-data` folder.

  `/prebuild_data/data/*.alt` folders can contain site-specific content
  they're not formally or by default part of this project and they're not
  included in this project's version control (they're in `.gitignore`).
*/

// helper functions

function getAltInputDir(dirName: string): string {
  const root = path.join(__dirname, "../data");
  return path.join(root, dirName + ".alt");
}

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
const imageNames: string[] = readImages(inputImages, outputImages, rootOutputDir);

// topics as tags

// returns an array of sentences
function getRandom(): string[][] {
  const inputDiscussions = path.join(getInputDir("discussions"), "random.txt");
  const text: string = fs.readFileSync(inputDiscussions, "utf8")
  const lines = text.split(/\r?\n/);
  const input: string[][] = [];

  lines.forEach(line => {
    if (!line.length) {
      return;
    }
    // split the line into sentences
    const words: string[] = line.split(".").map(word => word.trim()).filter(word => word.length);
    if (!words.length) {
      return;
    }
    input.push(words);
  });
  return input;
}

function getTopics(): { topicTitles: string[], tags: BareTopic[] } {
  const inputTopics = path.join(getAltInputDir("topics"), "topics.txt");
  if (fs.existsSync(inputTopics)) {
    const topicTitles: string[] = readTopicTitles(fs.readFileSync(inputTopics, "utf8"));
    // const tags: BareTopic[] = topicTitles.map((value, index) => {
    //   return { title: value };
    // });
    const tags: BareTopic[] = addSummaries(topicTitles, getRandom());
    return { topicTitles, tags };
  } else {
    const tags: BareTopic[] = readTopics(getRandom());
    const topicTitles: string[] = tags.map(tag => tag.title);
    return { topicTitles, tags };
  }
}

const { topicTitles, tags } = getTopics();
const outputTags: string = getOutputFile("tags");
writeJson(tags, outputTags);

// users

const inputUsers = path.join(getInputDir("users"), "users.json");
const outputUsers = getOutputFile("users");
const users = JSON.parse(fs.readFileSync(inputUsers, "utf8"));
writeJson(users, outputUsers);

// discussions

const tagKeys: string[] = [];
topicTitles.forEach(topic => tagKeys.push(getTagText(topic)));
const imageKeys: string[] = [];
imageNames.forEach(imageName => {
  const key = getTagText(imageName);
  if (tagKeys.includes(key) || imageKeys.includes(key)) {
    throw new Error("Ambiguous topic key: " + key);
  }
  imageKeys.push(key);
});

const outputDiscussions = getOutputFile("discussions");
const discussions = readDiscussions(getRandom(), users.length, tagKeys, imageKeys);
writeJson(discussions, outputDiscussions);
