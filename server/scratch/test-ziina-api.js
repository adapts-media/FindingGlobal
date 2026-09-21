import "dotenv/config";

async function main() {
  const ziinaToken = process.env.ZIINA_TOKEN;
  console.log("Using Token:", ziinaToken);
  
  const payload = {
    amount: 9900,
    currency_code: "AED",
    message: "FindingGlobal+ Growth Plan (monthly)",
    success_url: "http://localhost:5173/payment-success?payment_intent_id={PAYMENT_INTENT_ID}",
    cancel_url: "http://localhost:5173/upgrade",
    test: true
  };
  
  try {
    const response = await fetch("https://api-v2.ziina.com/api/payment_intent", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ziinaToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

main();
