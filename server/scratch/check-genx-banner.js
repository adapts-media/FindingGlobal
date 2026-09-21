import fs from "fs";

async function main() {
  const url = "https://thegenxmedia.com/wp-content/uploads/2024/09/rapid-growth-of-gaming-industry.jpg";
  console.log("Fetching GenXMedia banner...");
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch image");
    return;
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync("genx-banner.jpg", Buffer.from(buffer));
  console.log("Saved genx-banner.jpg");
  
  // Read signature & dimensions
  const localBuffer = fs.readFileSync("genx-banner.jpg");
  console.log("First 16 bytes:", localBuffer.subarray(0, 16).toString("hex"));
  
  // JPEG SOF check
  let i = 2;
  while (i < localBuffer.length) {
    if (localBuffer[i] === 0xFF) {
      const marker = localBuffer[i + 1];
      if (marker === 0xC0 || marker === 0xC2) {
        const height = localBuffer.readUInt16BE(i + 5);
        const width = localBuffer.readUInt16BE(i + 7);
        console.log(`JPEG dimensions: ${width} x ${height} (Aspect Ratio: ${(width / height).toFixed(2)}:1)`);
        return;
      }
      i += 2 + localBuffer.readUInt16BE(i + 2);
    } else {
      i++;
    }
  }
  console.log("Could not find JPEG SOF marker.");
}

main().catch(console.error);
