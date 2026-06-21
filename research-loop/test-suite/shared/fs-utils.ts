import * as fs from "fs";
import * as path from "path";

/**
 * Ensures a directory exists, creating it and any missing parents.
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Writes a JSON object to a file with pretty formatting.
 */
export function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Reads and JSON-parses a file. Returns null if file does not exist.
 */
export function readJson<T = unknown>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * Appends a tab-separated line to a TSV file.
 */
export function appendTsv(filePath: string, row: (string | number)[]): void {
  ensureDir(path.dirname(filePath));
  const line = row.join("\t") + "\n";
  fs.appendFileSync(filePath, line, "utf8");
}
