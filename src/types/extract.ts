export type MediaItem = {
  type: "image";
  url: string;
};

export type ExtractedXData = {
  sourceUrl: string;
  authorName: string;
  authorHandle: string;
  publishedAt: string;
  content: string;
  media: MediaItem[];
};

export type ExtractRequestBody = {
  url: string;
  bearerToken?: string;
};

export type ExtractResponseSuccess = {
  success: true;
  title: string;
  filename: string;
  markdown: string;
  data: ExtractedXData;
};

export type ExtractResponseError = {
  success: false;
  message: string;
};

export type ExtractResponse = ExtractResponseSuccess | ExtractResponseError;
