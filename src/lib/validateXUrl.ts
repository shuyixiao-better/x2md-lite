export function validateXUrl(url: string): { valid: true } | { valid: false; message: string } {
  if (!url) {
    return { valid: false, message: "请输入 X / Twitter 帖子链接。" };
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const validHost = hostname === "x.com" || hostname === "twitter.com";
    const validStatusPath = parsed.pathname.includes("/status/");

    if (!validHost || !validStatusPath) {
      return {
        valid: false,
        message: "请输入包含 /status/ 的公开 x.com 或 twitter.com 链接。"
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, message: "链接格式不正确，请检查后重试。" };
  }
}
