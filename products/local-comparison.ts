// Official prices and limits checked 2026-09-26. No live API calls are made.
export const comparisonCheckedAt = "2026-09-26";
export const comparisonSources = {
  gpt41: "https://developers.openai.com/api/docs/models/gpt-4.1",
  gptMini: "https://developers.openai.com/api/docs/models/gpt-5.4-mini",
  apiFiles: "https://developers.openai.com/api/docs/guides/file-inputs",
  apiData: "https://developers.openai.com/api/docs/guides/your-data",
  notebookPlans: "https://support.google.com/gemininotebook/answer/16213268?hl=en",
  notebookFiles: "https://support.google.com/gemininotebook/answer/16215270?hl=en",
  notebookData: "https://support.google.com/gemininotebook/answer/17004255?hl=en",
  notebookUsage: "https://support.google.com/gemininotebook/answer/17670842?hl=en",
} as const;
export const comparisonModels = [
  { id: "gpt-4.1", name: "GPT-4.1", input: 2, output: 8, source: comparisonSources.gpt41 },
  { id: "gpt-5.4-mini", name: "GPT-5.4 mini", input: .75, output: 4.5, source: comparisonSources.gptMini },
] as const;
export const notebookPlans = [
  { name: "Standard", detail: "무료", sources: 50 },
  { name: "Plus", detail: "Google AI", sources: 100 },
  { name: "Pro", detail: "Google AI", sources: 300 },
  { name: "Ultra", detail: "20 TB", sources: 500 },
  { name: "Ultra", detail: "30 TB", sources: 600 },
] as const;
export const estimateFields = {
  files: { label: "문서 수", unit: "개", min: 1, max: 1000, value: "20" },
  pages: { label: "문서당 페이지", unit: "쪽", min: 1, max: 1000, value: "50" },
  passes: { label: "전체 재처리 횟수", unit: "회", min: 1, max: 20, value: "1" },
  text: { label: "페이지당 입력 텍스트", unit: "토큰", min: 0, max: 10000, value: "1000" },
  image: { label: "페이지당 입력 이미지 토큰", unit: "토큰", min: 0, max: 10000, value: "1000" },
  output: { label: "페이지당 출력 토큰", unit: "토큰", min: 0, max: 10000, value: "1000" },
  exchange: { label: "계산용 환율 · 1달러", unit: "원", min: 1, max: 10000, value: "1400" },
} as const;
export type EstimateField = keyof typeof estimateFields;
export type EstimateValues = Record<EstimateField, string>;
export const defaultEstimate: EstimateValues = Object.fromEntries(Object.entries(estimateFields).map(([key, field]) => [key, field.value])) as EstimateValues;
export function validEstimateField(key: EstimateField, raw: string) {
  const value = Number(raw);
  return raw.trim() !== "" && Number.isInteger(value) && value >= estimateFields[key].min && value <= estimateFields[key].max;
}
export function calculateEstimate(values: EstimateValues) {
  if (!(Object.keys(estimateFields) as EstimateField[]).every(key => validEstimateField(key, values[key]))) return null;
  const pageCount = Number(values.files) * Number(values.pages) * Number(values.passes);
  const inputTokens = pageCount * (Number(values.text) + Number(values.image));
  const outputTokens = pageCount * Number(values.output);
  return {
    pageCount, inputTokens, outputTokens,
    models: comparisonModels.map(model => {
      const inputUsd = inputTokens * model.input / 1_000_000;
      const outputUsd = outputTokens * model.output / 1_000_000;
      const usd = inputUsd + outputUsd;
      return { ...model, inputUsd, outputUsd, usd, krw: usd * Number(values.exchange) };
    }),
  };
}
// A capacity illustration, not a promise that one answer reads every source.
export function requiredNotebooks(files: number, capacity: number) {
  if (!Number.isInteger(files) || files < 1 || !Number.isInteger(capacity) || capacity < 1) return null;
  return Math.ceil(files / capacity);
}
