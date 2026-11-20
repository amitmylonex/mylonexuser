export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(base + '/api/v1' + path, options);
  } catch {
    throw new Error('Could not reach MyloNex. Check your connection and try again.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    throw new ApiError(response.status, result?.message || 'MyloNex is temporarily unavailable.');
  }
  return result;
}
