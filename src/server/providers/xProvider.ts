import type { ExtractedXData, MediaItem } from "../../types/extract";
import { parseXUrl } from "../utils/parseXUrl";

export type ProviderEnv = {
  X_API_BEARER_TOKEN?: string;
  X_EXTRACT_API_KEY?: string;
};

type ProviderResult = ExtractedXData & {
  postId: string;
  title?: string;
};

type AdaptedProviderPayload = {
  title?: string;
  authorName?: string;
  authorHandle?: string;
  publishedAt?: string;
  content?: string;
  media?: MediaItem[];
};

type XApiPostLookupResponse = {
  data?: XApiPost;
  includes?: {
    users?: XApiUser[];
    media?: XApiMedia[];
  };
  errors?: XApiError[];
};

type XApiPost = {
  id?: string;
  text?: string;
  created_at?: string;
  author_id?: string;
};

type XApiUser = {
  id?: string;
  name?: string;
  username?: string;
};

type XApiMedia = {
  media_key?: string;
  type?: string;
  url?: string;
  preview_image_url?: string;
};

type XApiError = {
  detail?: string;
  title?: string;
  status?: number;
};

export async function extractXPost(
  sourceUrl: string,
  env: ProviderEnv
): Promise<ProviderResult> {
  const parsed = parseXUrl(sourceUrl);
  const bearerToken = env.X_API_BEARER_TOKEN ?? env.X_EXTRACT_API_KEY;

  if (!bearerToken) {
    return buildMockResult(sourceUrl, parsed.postId);
  }

  const requestUrl = buildLookupUrl(parsed.postId);
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: buildHeaders(bearerToken)
  });

  if (!response.ok) {
    const failurePayload = (await response.json().catch(() => null)) as unknown;
    const message = extractXApiErrorMessage(failurePayload);
    throw new Error(message ?? `X API 请求失败，状态码：${response.status}`);
  }

  const raw = (await response.json()) as unknown;
  const adapted = adaptProviderResponse(raw, parsed.authorSegment);

  return {
    sourceUrl,
    postId: parsed.postId,
    title: adapted.title,
    authorName: adapted.authorName ?? "Unknown Author",
    authorHandle: normalizeHandle(adapted.authorHandle, parsed.authorSegment),
    publishedAt: adapted.publishedAt ?? new Date().toISOString(),
    content: adapted.content?.trim() ?? "",
    media: adapted.media ?? []
  };
}

function buildHeaders(apiKey?: string): HeadersInit {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }

  return headers;
}

function buildLookupUrl(postId: string): string {
  const search = new URLSearchParams({
    expansions: "author_id,attachments.media_keys",
    "tweet.fields": "created_at,author_id,attachments,text",
    "user.fields": "name,username",
    "media.fields": "type,url,preview_image_url"
  });

  return `https://api.x.com/2/tweets/${postId}?${search.toString()}`;
}

function buildMockResult(sourceUrl: string, postId: string): ProviderResult {
  return {
    sourceUrl,
    postId,
    title: "OpenAI Mock Post",
    authorName: "OpenAI",
    authorHandle: "@OpenAI",
    publishedAt: new Date().toISOString(),
    content:
      "This is a mock X post used for local development. It demonstrates how X2MD Lite converts a post into Markdown.",
    media: []
  };
}

function normalizeHandle(
  handle: string | undefined,
  authorSegment: string
): string {
  const raw = handle?.trim() || authorSegment;

  if (!raw) {
    return "@unknown";
  }

  return raw.startsWith("@") ? raw : `@${raw}`;
}

function adaptProviderResponse(
  raw: unknown,
  fallbackAuthorSegment: string
): AdaptedProviderPayload {
  if (!isRecord(raw)) {
    throw new Error("X API 返回了无法识别的数据结构。");
  }

  const payload = raw as XApiPostLookupResponse;
  const errors = Array.isArray(payload.errors) ? payload.errors : [];

  if (!payload.data) {
    const firstError = errors[0];
    const message =
      firstError?.detail ?? firstError?.title ?? "X API 未返回帖子内容。";

    throw new Error(message);
  }

  const users = Array.isArray(payload.includes?.users) ? payload.includes.users : [];
  const media = Array.isArray(payload.includes?.media) ? payload.includes.media : [];
  const author = users.find((user) => user.id === payload.data?.author_id);

  return {
    authorName: pickString(author?.name) ?? "Unknown Author",
    authorHandle: normalizeHandle(
      pickString(author?.username),
      fallbackAuthorSegment
    ),
    publishedAt: pickString(payload.data.created_at) ?? new Date().toISOString(),
    content: pickString(payload.data.text)?.trim() ?? "",
    media: normalizeMedia(media)
  };
}

function normalizeMedia(value: XApiMedia[]): MediaItem[] {
  return value
    .map((item) => {
      if (item.type !== "photo") {
        return null;
      }

      const url = pickString(item.url) ?? pickString(item.preview_image_url);

      if (!url) {
        return null;
      }

      return { type: "image" as const, url };
    })
    .filter((item): item is MediaItem => item !== null);
}

function extractXApiErrorMessage(raw: unknown): string | undefined {
  if (!isRecord(raw) || !Array.isArray(raw.errors) || raw.errors.length === 0) {
    return undefined;
  }

  const firstError = raw.errors[0];

  if (!isRecord(firstError)) {
    return undefined;
  }

  return pickString(firstError.detail) ?? pickString(firstError.title);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
