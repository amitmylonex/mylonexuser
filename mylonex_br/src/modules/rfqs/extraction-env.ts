export const env = { server: { get OPENAI_API_KEY() { return process.env.OPENAI_API_KEY } } };
