import "dotenv/config";

async function run() {
  const tokenRes = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "password" })
  });
  const { token } = await tokenRes.json();
  
  const res = await fetch("http://localhost:4000/api/projects", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run();
