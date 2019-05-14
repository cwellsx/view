import { config } from "../config";

export function getExerpt(markdown: string): string {
  const words: string[] = markdown.split(" ");
  let rc: string | undefined;
  for (const word of words) {
    if (!word.length) {
      continue;
    }
    if (rc && (rc.length + word.length > config.exerptlength)) {
      break;
    }
    rc = rc ? (rc + " " + word): word;
  }
  return rc ? rc : "(no message)";
}
