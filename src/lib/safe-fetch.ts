import dns from "dns";
import net from "net";

/**
 * Outbound fetch for user-supplied URLs.
 *
 * Career page URLs come straight from user input, so an unguarded fetch would
 * let anyone point the scraper at internal services or the cloud metadata
 * endpoint. Every URL — including each redirect hop — is checked for scheme,
 * port, and resolved IP before a request is made.
 *
 * Known limitation: the address is validated by resolving DNS, then `fetch`
 * resolves it again when connecting. A record that changes between those two
 * lookups (DNS rebinding) is not caught. Closing that fully requires pinning
 * the connection to the validated IP via a custom dispatcher.
 */

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const ALLOWED_PORTS = new Set(["", "80", "443", "8080"]);

const BLOCKED_HOSTNAME_SUFFIXES = [".local", ".internal", ".localhost", ".home.arpa"];

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;
const MAX_REDIRECTS = 4;

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isPrivateIPv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  const inRange = (cidr: string, bits: number) => {
    const base = ipv4ToInt(cidr);
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (base & mask);
  };

  return (
    inRange("0.0.0.0", 8) || // "this network"
    inRange("10.0.0.0", 8) || // private
    inRange("100.64.0.0", 10) || // carrier-grade NAT
    inRange("127.0.0.0", 8) || // loopback
    inRange("169.254.0.0", 16) || // link-local, incl. cloud metadata
    inRange("172.16.0.0", 12) || // private
    inRange("192.0.0.0", 24) || // IETF protocol assignments
    inRange("192.0.2.0", 24) || // TEST-NET-1
    inRange("192.168.0.0", 16) || // private
    inRange("198.18.0.0", 15) || // benchmarking
    inRange("198.51.100.0", 24) || // TEST-NET-2
    inRange("203.0.113.0", 24) || // TEST-NET-3
    inRange("224.0.0.0", 4) || // multicast
    inRange("240.0.0.0", 4) // reserved, incl. broadcast
  );
}

function isPrivateIPv6(ip: string): boolean {
  const address = ip.toLowerCase().split("%")[0];
  // URL parsing canonicalizes expanded and hexadecimal IPv4-mapped forms too.
  const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1);

  if (normalized.startsWith("::")) {
    return true;
  }

  return (
    /^f[cd][0-9a-f]{2}:/.test(normalized) || // unique local fc00::/7
    /^fe[89ab][0-9a-f]:/.test(normalized) // link-local fe80::/10
  );
}

export function isPrivateAddress(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  // Not a literal address; caller resolves it first.
  return true;
}

/** Throws `UnsafeUrlError` unless the URL is a public http(s) endpoint. */
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("That does not look like a valid URL.");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UnsafeUrlError("Only http and https URLs are supported.");
  }

  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with credentials are not supported.");
  }

  if (!ALLOWED_PORTS.has(url.port)) {
    throw new UnsafeUrlError("That port is not allowed.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    hostname === "localhost" ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new UnsafeUrlError("That host is not reachable from the scanner.");
  }

  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new UnsafeUrlError("That address is not reachable from the scanner.");
    }
    return url;
  }

  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError("That domain could not be resolved.");
  }

  if (addresses.length === 0 || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new UnsafeUrlError("That address is not reachable from the scanner.");
  }

  return url;
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  accept?: string;
}

export interface SafeFetchResult {
  url: string;
  status: number;
  contentType: string;
  body: string;
}

/**
 * Fetches a validated URL, following redirects manually so each hop is
 * re-validated, and truncating the body at `maxBytes`.
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertSafeUrl(currentUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          // Some boards return an empty page or a challenge without a
          // browser-shaped User-Agent.
          "User-Agent":
            "Mozilla/5.0 (compatible; ATSJobWatcher/1.0; +https://github.com/Aditya190853)",
          Accept: options.accept ?? "text/html,application/json;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    } catch (error) {
      clearTimeout(timer);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Timed out after ${timeoutMs}ms`);
      }
      throw error;
    }

    if (response.status >= 300 && response.status < 400) {
      clearTimeout(timer);
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`Redirect (${response.status}) without a location header`);
      }
      currentUrl = new URL(location, url).toString();
      continue;
    }

    try {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const body = await readCapped(response, maxBytes);
      return {
        url: url.toString(),
        status: response.status,
        contentType: response.headers.get("content-type") ?? "",
        body,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("Too many redirects");
}

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return (await response.text()).slice(0, maxBytes);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    chunks.push(value);
    total += value.byteLength;
  }

  await reader.cancel().catch(() => undefined);

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8").decode(merged.slice(0, maxBytes));
}
