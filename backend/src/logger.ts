import fs from "fs";
import path from "path";

const logDirectory = path.join(process.cwd(), "logs");
const logFile = path.join(logDirectory, "app.log");

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

function getTimestamp() {
  const now = new Date();

  const timestamp = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  return `${timestamp} -03:00`;
}

function writeLog(level: string, category: string, message: string) {
  const timestamp = getTimestamp();

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