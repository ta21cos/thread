// NOTE: Type-safe fetch helper for contract tests
export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<{ response: Response; data: T }> {
  const response = await fetch(input, init);
  const data = (await response.json()) as T;
  return { response, data };
}
