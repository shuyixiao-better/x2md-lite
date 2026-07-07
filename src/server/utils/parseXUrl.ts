export type ParsedXUrl = {
  hostname: "x.com" | "twitter.com";
  authorSegment: string;
  postId: string;
};

export function parseXUrl(url: string): ParsedXUrl {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("链接格式不正确。");
  }

  const hostname = parsed.hostname.replace(/^www\./, "");

  if (hostname !== "x.com" && hostname !== "twitter.com") {
    throw new Error("仅支持 x.com 或 twitter.com 链接。");
  }

  const match = parsed.pathname.match(/^\/([^/]+)\/status\/(\d+)/);

  if (!match) {
    throw new Error("链接中缺少有效的状态 ID。");
  }

  return {
    hostname,
    authorSegment: match[1],
    postId: match[2]
  };
}
