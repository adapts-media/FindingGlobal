import fs from "fs";

function main() {
  const buffer = fs.readFileSync("adapts-banner.jpg");
  console.log("First 16 bytes:", buffer.subarray(0, 16).toString("hex"));
  
  // PNG magic check
  if (buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    console.log(`PNG dimensions: ${width} x ${height} (Aspect Ratio: ${(width / height).toFixed(2)}:1)`);
    return;
  }
  
  // WebP magic check: RIFF .... WEBP
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    console.log("WebP image detected.");
    return;
  }
  
  console.log("Not a PNG. Trying basic check...");
}

main();
