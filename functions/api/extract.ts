import { createExtractResult } from "../../src/server/handleExtract";

type Env = {
  X_API_BEARER_TOKEN?: string;
  X_EXTRACT_API_KEY?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

export const onRequestPost = async ({ request, env }: PagesContext) => {
  try {
    const body = (await request.json()) as {
      url?: unknown;
      bearerToken?: unknown;
    };
    const result = await createExtractResult(
      {
        url: typeof body.url === "string" ? body.url : "",
        bearerToken:
          typeof body.bearerToken === "string" ? body.bearerToken : undefined
      },
      env
    );

    return Response.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "请求体格式错误。";

    return Response.json(
      {
        success: false,
        message
      },
      { status: 400 }
    );
  }
};
