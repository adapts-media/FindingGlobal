// Guards against SSRF for outbound requests built from user-supplied URLs (see /api/proxy in
// index.js). A URL string alone isn't enough to trust — the hostname has to actually resolve
// to a public IP, every hop of a redirect chain has to be re-checked the same way (otherwise
// an attacker can point at a safe public host that 302s to http://169.254.169.254/ or an
// internal service), and the scheme has to be restricted to http/https.
import dns from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 5;

// IPv4 ranges that must never be reachable from a URL an outside caller controls: loopback,
// RFC1918 private ranges, link-local (this is what makes AWS/GCP/Azure's 169.254.169.254
// metadata endpoint dangerous), CGNAT, documentation/test ranges, multicast, and reserved.
const IPV4_BLOCKED_RANGES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function ipv4ToInt(ip) {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isBlockedIpv4(ip) {
  const target = ipv4ToInt(ip);
  return IPV4_BLOCKED_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (target & mask) === (ipv4ToInt(base) & mask);
  });
}

function isBlockedIpv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local fe80::/10
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
  if (lower.startsWith("ff")) return true; // multicast
  // IPv4-mapped (::ffff:a.b.c.d) — check the embedded IPv4 too, since that's a real bypass path.
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  return false;
}

function isBlockedIp(ip) {
  return net.isIP(ip) === 4 ? isBlockedIpv4(ip) : isBlockedIpv6(ip);
}

async function assertPublicHost(hostname) {
  // A bare IP literal in the URL — validate it directly, no DNS involved.
  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("URL resolves to a private or reserved address");
    return;
  }
  let records;
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("Could not resolve host");
  }
  if (records.length === 0) throw new Error("Could not resolve host");
  // Reject if ANY resolved address is private — DNS can return multiple records, and we can't
  // control which one the underlying fetch implementation will actually connect to.
  if (records.some((r) => isBlockedIp(r.address))) {
    throw new Error("URL resolves to a private or reserved address");
  }
}

// Fetches a URL only after confirming it (and every redirect hop) points at a public host,
// over http/https. Throws on anything else instead of following it.
export async function safeFetch(urlString, { timeoutMs = 10000 } = {}) {
  let current = urlString;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(current);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Only http and https URLs are allowed");
    }
    await assertPublicHost(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(parsed.toString(), { redirect: "manual", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      // Re-validate the redirect target from scratch on the next loop iteration rather than
      // letting fetch follow it blindly.
      current = new URL(response.headers.get("location"), parsed).toString();
      continue;
    }

    return response;
  }

  throw new Error("Too many redirects");
}
