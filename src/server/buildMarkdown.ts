import { sanitizeFilename } from "./sanitizeFilename";
import type { ExtractedXData, ExtractResponseSuccess } from "../types/extract";

type BuildMarkdownInput = {
  data: ExtractedXData;
  postId: string;
  title?: string;
};

export function buildMarkdownPayload({
  data,
  postId,
  title
}: BuildMarkdownInput): Omit<ExtractResponseSuccess, "success" | "data"> {
  const finalTitle = buildTitle(title, data.content, data.authorHandle, postId);
  const filename = buildFilename(finalTitle, postId);
  const markdown = buildMarkdown(finalTitle, data);

  return {
    title: finalTitle,
    filename,
    markdown
  };
}

function buildTitle(
  incomingTitle: string | undefined,
  content: string,
  authorHandle: string,
  postId: string
): string {
  const normalizedTitle = normalizeText(incomingTitle);

  if (normalizedTitle) {
    return normalizedTitle;
  }

  const normalizedContent = normalizeText(content);

  if (normalizedContent) {
    const limit = containsCjk(normalizedContent) ? 30 : 60;
    return normalizedContent.slice(0, limit);
  }

  return normalizeText(`${authorHandle}${postId}`) || `Post ${postId}`;
}

function buildFilename(title: string, postId: string): string {
  const suffix = `_${postId.slice(-6)}`;
  const maxLength = 80;
  const extension = ".md";
  const maxBaseLength = maxLength - extension.length - suffix.length;
  const safeTitle = sanitizeFilename(title) || "x-post";
  const truncatedTitle = safeTitle.slice(0, Math.max(maxBaseLength, 1)).trim();

  return `${truncatedTitle}${suffix}${extension}`;
}

function buildMarkdown(title: string, data: ExtractedXData): string {
  const sections = [
    `# ${title}`,
    "",
    `> 作者：${data.authorName} ${data.authorHandle}`,
    `> 发布时间：${data.publishedAt}`,
    `> 来源：${data.sourceUrl}`,
    "",
    "## 原文内容",
    "",
    data.content || "（无正文内容）"
  ];

  const imageItems = data.media.filter((item) => item.type === "image");

  if (imageItems.length > 0) {
    sections.push("", "## 媒体内容", "");
    imageItems.forEach((item, index) => {
      sections.push(`![image ${index + 1}](${item.url})`);
    });
  }

  sections.push("", "## 原始链接", "", data.sourceUrl);

  return sections.join("\n");
}

function normalizeText(input: string | undefined): string {
  return (input ?? "").replace(/\s+/g, " ").trim();
}

function containsCjk(input: string): boolean {
  return /[\u3400-\u9fff]/.test(input);
}
