import { URL } from "url";
import * as net from "net";

const LINK_LOCAL_PREFIXES = ["169.254.", "fe80:"];

const PRIVATE_PREFIXES = ["10.", "127.", "0.", "::1", "fc00:"];

function isPrivateIP(host: string): boolean {
  if (host.startsWith("172.")) {
    const second = parseInt(host.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (host.startsWith("192.168.")) return true;
  for (const p of PRIVATE_PREFIXES) {
    if (host.startsWith(p)) return true;
  }
  for (const p of LINK_LOCAL_PREFIXES) {
    if (host.startsWith(p)) return true;
  }
  return false;
}

const BLOCKED_HOSTNAMES = [
  /^localhost$/i,
  /^127\.0\.0\.1$/,
  /^0\.0\.0\.0$/,
  /^broadcasthost$/i,
  /\.local$/i,
  /metadata\.google\.internal/i,
];

export function validateWebhookUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error(`Invalid URL: ${urlString}`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(
      `Blocked URL protocol: ${url.protocol}. Only http and https are allowed.`,
    );
  }

  const hostname = url.hostname;

  for (const pattern of BLOCKED_HOSTNAMES) {
    if (pattern.test(hostname)) {
      throw new Error(
        `Blocked hostname: ${hostname}. Internal/private hosts are not allowed.`,
      );
    }
  }

  if (net.isIP(hostname) !== 0 && isPrivateIP(hostname)) {
    throw new Error(
      `Blocked IP: ${hostname}. Private/link-local IPs are not allowed.`,
    );
  }

  return url;
}
