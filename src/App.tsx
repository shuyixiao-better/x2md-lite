import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { downloadMarkdown } from "./lib/download";
import { emptyMarkdownHint } from "./lib/markdown";
import { validateXUrl } from "./lib/validateXUrl";
import type { ExtractResponseSuccess } from "./types/extract";

type ExtractState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: ExtractResponseSuccess }
  | { kind: "error"; message: string };

export default function App() {
  const [url, setUrl] = useState("");
  const [bearerToken, setBearerToken] = useState("");
  const [extractState, setExtractState] = useState<ExtractState>({
    kind: "idle"
  });
  const [copyState, setCopyState] = useState<"idle" | "success">("idle");

  const markdown = useMemo(() => {
    return extractState.kind === "success"
      ? extractState.result.markdown
      : emptyMarkdownHint;
  }, [extractState]);

  const canUseResult = extractState.kind === "success";

  async function handleExtract() {
    const trimmed = url.trim();
    const validation = validateXUrl(trimmed);

    if (!validation.valid) {
      setExtractState({
        kind: "error",
        message: validation.message
      });
      return;
    }

    setExtractState({ kind: "loading" });
    setCopyState("idle");

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: trimmed,
          bearerToken: bearerToken.trim() || undefined
        })
      });

      const data = (await response.json()) as
        | ExtractResponseSuccess
        | { success: false; message: string };

      if (!response.ok || !data.success) {
        throw new Error(
          "message" in data ? data.message : "提取失败，请稍后再试。"
        );
      }

      setExtractState({ kind: "success", result: data });
    } catch (error) {
      setExtractState({
        kind: "error",
        message: error instanceof Error ? error.message : "请求失败，请稍后再试。"
      });
    }
  }

  async function handleCopy() {
    if (!canUseResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(extractState.result.markdown);
      setCopyState("success");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setExtractState({
        kind: "error",
        message: "复制失败，请检查浏览器剪贴板权限。"
      });
    }
  }

  function handleDownload() {
    if (!canUseResult) {
      return;
    }

    downloadMarkdown(
      extractState.result.markdown,
      extractState.result.filename
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.14),_transparent_35%),linear-gradient(180deg,_#f7fbfc_0%,_#eef4f7_100%)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="mx-auto max-w-6xl rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="mb-8 text-center">
            <p className="mb-3 inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              X to Markdown
            </p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              X2MD Lite
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              粘贴 X 链接，生成 Markdown 预览并下载
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700" htmlFor="x-url">
              X / Twitter 链接
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                id="x-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://x.com/xxx/status/1234567890"
                className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={handleExtract}
                disabled={extractState.kind === "loading"}
                className="h-12 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {extractState.kind === "loading" ? "提取中..." : "提取内容"}
              </button>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              支持 `x.com` 与 `twitter.com` 公开帖子链接，且必须包含 `/status/`。
            </p>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <label
                className="mb-2 block text-sm font-medium text-slate-700"
                htmlFor="x-bearer-token"
              >
                X API Bearer Token（可选）
              </label>
              <input
                id="x-bearer-token"
                type="password"
                value={bearerToken}
                onChange={(event) => setBearerToken(event.target.value)}
                placeholder="输入你的 Bearer Token；留空则尝试使用服务端环境变量"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
              <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                <p>
                  获取方式：前往{" "}
                  <a
                    href="https://console.x.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-4"
                  >
                    X Developer Console
                  </a>{" "}
                  创建 App，在 Keys and tokens 页面获取 Bearer Token。
                </p>
                <p>
                  官方说明见{" "}
                  <a
                    href="https://docs.x.com/x-api/getting-started/getting-access"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-4"
                  >
                    Getting Access
                  </a>{" "}
                  和{" "}
                  <a
                    href="https://docs.x.com/fundamentals/authentication/oauth-2-0/bearer-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-teal-700 underline decoration-teal-300 underline-offset-4"
                  >
                    Bearer Tokens
                  </a>
                  。
                </p>
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  这个模式更适合你自己或团队内部使用。公开部署时，不建议让普通访客输入你的开发者 Token。
                </p>
              </div>
            </div>

            {extractState.kind === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {extractState.message}
              </div>
            ) : null}

            {extractState.kind === "loading" ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                正在提取内容并生成 Markdown，请稍候...
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    文件名
                  </span>
                  <span className="break-all text-sm text-slate-700">
                    {canUseResult
                      ? extractState.result.filename
                      : "生成后会显示 Markdown 文件名"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!canUseResult}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-500 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copyState === "success" ? "已复制" : "复制 Markdown"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!canUseResult}
                    className="rounded-2xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
                  >
                    下载 Markdown
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Markdown 原文
                  </h2>
                  <span className="text-xs text-slate-500">
                    可直接复制或下载为 `.md`
                  </span>
                </div>
                <textarea
                  readOnly
                  value={markdown}
                  className="h-[420px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">
                  Markdown 预览
                </h2>
                <span className="text-xs text-slate-500">支持 GFM</span>
              </div>
              <div className="markdown-preview h-[520px] overflow-y-auto rounded-2xl border border-slate-200 bg-mist p-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
