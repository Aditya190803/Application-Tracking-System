import { describe, expect, it } from "vite-plus/test";

import { assertSafeUrl, isPrivateAddress, UnsafeUrlError } from "@/lib/safe-fetch";

describe("isPrivateAddress", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "0:0:0:0:0:ffff:a00:1",
    "::ffff:a9fe:a9fe",
  ])("treats %s as private", (ip) => {
    expect(isPrivateAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700::1111"])(
    "treats %s as public",
    (ip) => {
      expect(isPrivateAddress(ip)).toBe(false);
    },
  );

  it("treats anything that is not an address literal as unsafe", () => {
    expect(isPrivateAddress("example.com")).toBe(true);
  });
});

describe("assertSafeUrl", () => {
  it.each([
    ["file:///etc/passwd", /http and https/],
    ["ftp://acme.com/jobs", /http and https/],
    ["https://acme.com:22/jobs", /port/],
    ["http://localhost/jobs", /not reachable/],
    ["http://build.local/jobs", /not reachable/],
    ["http://127.0.0.1/jobs", /not reachable/],
    ["http://169.254.169.254/latest/meta-data", /not reachable/],
    ["http://[::ffff:127.0.0.1]/jobs", /not reachable/],
    ["http://[0:0:0:0:0:ffff:a00:1]/jobs", /not reachable/],
    ["https://user:password@8.8.8.8/jobs", /credentials/],
    ["not-a-url", /valid URL/],
  ])("rejects %s", async (url, message) => {
    await expect(assertSafeUrl(url)).rejects.toThrow(message);
  });

  it("rejects with UnsafeUrlError so routes can map it to a 400", async () => {
    await expect(assertSafeUrl("http://10.0.0.5/jobs")).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it("accepts a public address literal", async () => {
    const url = await assertSafeUrl("https://8.8.8.8/careers");
    expect(url.hostname).toBe("8.8.8.8");
  });
});
