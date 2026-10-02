import fs from "fs";
import path from "path";

const logDirectory = path.join(process.cwd(), "logs");
const logFile = path.join(logDirectory, "app.log");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

function writeLog(level: string, category: string, message: string) {
  const timestamp = new Date().toISOString();

  const logLine =
    `${timestamp} ${level} ${category} ${message}\n`;

  fs.appendFileSync(logFile, logLine);
}

export function logInfo(category: string, message: string) {
  writeLog("INFO", category, message);
}

export function logWarn(category: string, message: string) {
  writeLog("WARN", category, message);
}

export function logError(category: string, message: string) {
  writeLog("ERROR", category, message);
}