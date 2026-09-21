import fs from "fs";

async function main() {
  const url = "https://sortlist-core-api.s3.eu-west-1.amazonaws.com/bnb0uc4xb8g8xte1wuwbzfr77ka2";
  console.log("Fetching image from S3...");
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch image");
    return;
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync("adapts-banner.jpg", Buffer.from(buffer));
  console.log("Saved adapts-banner.jpg");
}

main().catch(console.error);
