const dotenv = require('dotenv');
const { z } = require('zod');
const { AI_MODELS, DEFAULT_MODEL } = require('./lib/constants.js');

dotenv.config();

const defaultConfig = {
  AI_ENDPOINT: 'https://api.openai.com/v1',
  GITHUB_TOKEN: 'default_token',
  DEFAULT_MODEL: DEFAULT_MODEL,
  CACHE_ENABLED: true,
  CACHE_SIZE: 100,
  CACHE_TTL: 3600000,
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2000,
  DEFAULT_TOP_P: 1,
  DEEPSEEK_ENABLED: false,
  DEEPSEEK_API_KEY: '',
  DEEPSEEK_API_ENDPOINT: 'https://api.deepseek.com/v1',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

const envSchema = z.object({
  AI_ENDPOINT: z.string().url().default(defaultConfig.AI_ENDPOINT),
  GITHUB_TOKEN: z.string().min(1).default(defaultConfig.GITHUB_TOKEN),
  DEFAULT_MODEL: z.string().refine(
    model => AI_MODELS.includes(model),
    model => ({ message: `Model "${model}" must be one of: ${AI_MODELS.join(', ')}` })
  ).default(defaultConfig.DEFAULT_MODEL),
  CACHE_ENABLED: z.coerce.boolean().default(defaultConfig.CACHE_ENABLED),
  CACHE_SIZE: z.coerce.number().positive().default(defaultConfig.CACHE_SIZE),
  CACHE_TTL: z.coerce.number().positive().default(defaultConfig.CACHE_TTL),
  DEFAULT_TEMPERATURE: z.coerce.number().min(0).max(1).default(defaultConfig.DEFAULT_TEMPERATURE),
  DEFAULT_MAX_TOKENS: z.coerce.number().positive().default(defaultConfig.DEFAULT_MAX_TOKENS),
  DEFAULT_TOP_P: z.coerce.number().min(0).max(1).default(defaultConfig.DEFAULT_TOP_P),
  DEEPSEEK_ENABLED: z.coerce.boolean().default(defaultConfig.DEEPSEEK_ENABLED),
  DEEPSEEK_API_KEY: z.string().default(defaultConfig.DEEPSEEK_API_KEY),
  DEEPSEEK_API_ENDPOINT: z.string().url().default(defaultConfig.DEEPSEEK_API_ENDPOINT),
  RETRY_ATTEMPTS: z.coerce.number().positive().default(defaultConfig.RETRY_ATTEMPTS),
  RETRY_DELAY: z.coerce.number().positive().default(defaultConfig.RETRY_DELAY),
});

const mergedConfig = {
  ...defaultConfig,
  ...process.env
};

const config = envSchema.parse(mergedConfig);

module.exports = config;