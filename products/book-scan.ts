// Official rules checked 2026-09-26. Estimates, not measured API usage.
export const bookScanSources = {
  model: 'https://developers.openai.com/api/docs/models/gpt-6-astra',
  vision: 'https://developers.openai.com/api/docs/guides/images-vision',
  pricing: 'https://developers.openai.com/api/docs/pricing',
  files: 'https://developers.openai.com/api/docs/guides/file-inputs',
  reasoning: 'https://developers.openai.com/api/docs/guides/reasoning',
  caching: 'https://developers.openai.com/api/docs/guides/prompt-caching',
  plus: 'https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus',
  uploads: 'https://help.openai.com/en/articles/8555545-file-uploads-faq',
};
export const scanModes = {
  high: { label: '축소 이미지 · high', width: 2480, height: 3508, detail: 'high' },
  original: { label: '300dpi 원본 · original', width: 2480, height: 3508, detail: 'original' },
} as const;
export type ScanMode = keyof typeof scanModes;
export function imageTokenEstimate(width: number, height: number, detail: 'high' | 'original') {
  if (![width, height].every(n => Number.isInteger(n) && n > 0 && n <= 65535)) throw new RangeError('Unsupported image dimensions');
  let w = width, h = height;
  if (detail === 'high' && Math.ceil(w / 32) * Math.ceil(h / 32) > 2500) {
    const scale = Math.sqrt(1024 * 2500 / (w * h));
    const adjusted = scale * Math.min(Math.floor(w * scale / 32) / (w * scale / 32), Math.floor(h * scale / 32) / (h * scale / 32));
    w = Math.floor(w * adjusted); h = Math.floor(h * adjusted);
  }
  const patches = Math.ceil(w / 32) * Math.ceil(h / 32);
  if (patches > 30000) throw new RangeError('Image exceeds patch limit');
  return { width: w, height: h, patches, tokens: Math.ceil(patches * 1.2) };
}
export function astraRequestEstimate(input: number, output: number) {
  if (![input, output].every(n => Number.isInteger(n) && n >= 0)) throw new RangeError('Invalid token counts');
  const long = input > 272000;
  return { inputUsd: input * (long ? 20 : 10) / 1e6, outputUsd: output * (long ? 75 : 50) / 1e6, fits: input <= 922000 && output <= 128000 && input + output <= 1050000, long };
}
export function estimateBook(mode: ScanMode, outputPerPage = 1000, budget = 20) {
  if (!Number.isInteger(outputPerPage) || outputPerPage < 1 || !Number.isFinite(budget) || budget < 0) throw new RangeError('Invalid book assumptions');
  const selected = scanModes[mode];
  const image = imageTokenEstimate(selected.width, selected.height, selected.detail);
  const pages = 200, batchPages = 20, requests = pages / batchPages, promptPerRequest = 200;
  const inputTokens = image.tokens * pages;
  const outputTokens = outputPerPage * pages;
  const batch = astraRequestEstimate(image.tokens * batchPages + promptPerRequest, outputPerPage * batchPages);
  const inputUsd = batch.inputUsd * requests, outputUsd = batch.outputUsd * requests;
  const totalUsd = inputUsd + outputUsd;
  return { image, pages, requests, batchPages, inputTokens, outputTokens, inputUsd, outputUsd, totalUsd, books: batch.fits ? Math.floor((budget + 1e-9) / totalUsd) : 0, batchFits: batch.fits, oneRequestFits: astraRequestEstimate(inputTokens + promptPerRequest, outputTokens).fits };
}

export function bookScanCsv() {
  const rows = ['mode,pages,width,height,image_tokens_per_page,image_tokens_per_book,output_tokens_per_page,output_tokens_per_book,pages_per_request,requests,prompt_tokens_per_request,input_usd,output_usd,base_usd,budget_usd,whole_books_upper_bound'];
  for (const output of [500, 1000, 2000]) for (const mode of ['high', 'original'] as const) {
    const r = estimateBook(mode, output);
    rows.push([mode, 200, r.image.width, r.image.height, r.image.tokens, r.inputTokens, output, r.outputTokens, 20, 10, 200, r.inputUsd.toFixed(4), r.outputUsd.toFixed(4), r.totalUsd.toFixed(4), 20, r.books].join(','));
  }
  return rows.join('\n') + '\n';
}
