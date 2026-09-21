import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, "../../public/minimallogo");
const buffer = fs.readFileSync(logoPath);
console.log("First 16 bytes:", buffer.subarray(0, 16).toString("hex"));
console.log("First 16 bytes as ascii:", buffer.subarray(0, 16).toString("ascii"));
