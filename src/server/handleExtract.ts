import { buildMarkdownPayload } from "./buildMarkdown";
import { extractXPost, type ProviderEnv } from "./providers/xProvider";
import type {
  ExtractRequestBody,
  ExtractResponse,
  ExtractResponseError
} from "../types/extract";
import { validateXUrl } from "../lib/validateXUrl";

export async function createExtractResult(
  body: ExtractRequestBody,
  env: ProviderEnv
): Promise<ExtractResponse> {
  const validation = validateXUrl(body.url);

  if (!validation.valid) {
    return error(validation.message);
  }

  try {
    const result = await extractXPost(body.url, env);
    const payload = buildMarkdownPayload({
      data: {
        sourceUrl: result.sourceUrl,
        authorName: result.authorName,
        authorHandle: result.authorHandle,
        publishedAt: result.publishedAt,
        content: result.content,
        media: result.media
      },
      postId: result.postId,
      title: result.title
    });

    return {
      success: true,
      ...payload,
      data: {
        sourceUrl: result.sourceUrl,
        authorName: result.authorName,
        authorHandle: result.authorHandle,
        publishedAt: result.publishedAt,
        content: result.content,
        media: result.media
      }
    };
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(reason: unknown): ExtractResponseError {
  const message =
    reason instanceof Error ? reason.message : "提取失败，请稍后再试。";

  return error(message);
}

function error(message: string): ExtractResponseError {
  return {
    success: false,
    message
  };
}
