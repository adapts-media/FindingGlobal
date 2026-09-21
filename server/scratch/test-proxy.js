async function test() {
  const imageUrl = "https://thegenxmedia.com/wp-content/uploads/2024/09/rapid-growth-of-gaming-industry.jpg";
  const proxyUrl = `http://localhost:4000/api/proxy?url=${encodeURIComponent(imageUrl)}`;
  
  console.log(`Testing proxy url: ${proxyUrl}`);
  try {
    const res = await fetch(proxyUrl);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log("Headers:");
    res.headers.forEach((val, key) => {
      console.log(` - ${key}: ${val}`);
    });
    
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      console.log(`Success! Fetched ${buffer.byteLength} bytes.`);
    } else {
      const text = await res.text();
      console.error(`Failed: ${text}`);
    }
  } catch (err) {
    console.error("Error connecting to server:", err.message);
  }
}

test();
