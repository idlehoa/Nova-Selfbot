/**
 * AI Model Constants
 * Last Updated: 2025-05-08 03:52:49 UTC
 * @author idlehoa
 */

// All supported AI models
const AI_MODELS = [
  // DeepSeek Models
  'deepseek-chat',          // Base chat model
  'deepseek-coder',         // Code specialized model
  'deepseek-large',         // Large context model
  'deepseek-base',          // Base model for general tasks
  'deepseek-8b',            // 8B parameter model
  'deepseek-16b',           // 16B parameter model
  'deepseek-67b',           // 67B parameter model
  'deepseek-chat-instruct', // Instruction-tuned chat model
  
  // GPT-4 Series
  'gpt-4',                  // Base GPT-4 model
  'gpt-4o',                 // Optimized GPT-4 variant
  'gpt-4-32k',              // Extended context GPT-4
  'gpt-4-turbo',            // High-performance GPT-4
  'gpt-4-0125',             // January 2025 version
  'gpt-4-1106',             // November 2024 version
  'gpt-4-vision',           // GPT-4 with vision capabilities
  
  // GPT-3.5 Series
  'gpt-3.5-turbo',          // Standard GPT-3.5
  'gpt-3.5-turbo-16k',      // Extended context GPT-3.5
  'gpt-3.5-turbo-0125',     // Latest GPT-3.5 version
  'gpt-3.5-turbo-1106',     // Previous GPT-3.5 version
  'gpt-3.5-turbo-0613',     // June 2023 version
  'gpt-3.5-turbo-0301'      // March 2023 version
];

// Default model setting
const DEFAULT_MODEL = 'gpt-4o';

// Model Categories for better organization
const MODEL_CATEGORIES = {
  DEEPSEEK: [
    'deepseek-chat',
    'deepseek-coder',
    'deepseek-large',
    'deepseek-base',
    'deepseek-8b',
    'deepseek-16b',
    'deepseek-67b',
    'deepseek-chat-instruct'
  ],
  GPT4: [
    'gpt-4',
    'gpt-4o',
    'gpt-4-32k',
    'gpt-4-turbo',
    'gpt-4-0125',
    'gpt-4-1106',
    'gpt-4-vision'
  ],
  GPT35: [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-3.5-turbo-0125',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-0301'
  ]
};

// Model configurations with default parameters
const MODEL_CONFIGS = {
  // DeepSeek Models
  'deepseek-chat': {
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1,
    provider: 'deepseek'
  },
  'deepseek-coder': {
    maxTokens: 16384,
    temperature: 0.5,
    topP: 1,
    provider: 'deepseek'
  },
  'deepseek-large': {
    maxTokens: 16384,
    temperature: 0.7,
    topP: 1,
    provider: 'deepseek'
  },
  'deepseek-base': {
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
    provider: 'deepseek'
  },
  'deepseek-8b': {
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
    provider: 'deepseek'
  },
  'deepseek-16b': {
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1,
    provider: 'deepseek'
  },
  'deepseek-67b': {
    maxTokens: 16384,
    temperature: 0.7,
    topP: 1,
    provider: 'deepseek'
  },
  'deepseek-chat-instruct': {
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1,
    provider: 'deepseek'
  },
  
  // GPT-4 Models
  'gpt-4': {
    maxTokens: 8192,
    temperature: 0.7,
    topP: 1,
    provider: 'openai'
  },
  'gpt-4o': {
    maxTokens: 8192,
    temperature: 0.5,
    topP: 1,
    provider: 'openai'
  },
  'gpt-4-32k': {
    maxTokens: 32768,
    temperature: 0.7,
    topP: 1,
    provider: 'openai'
  },
  'gpt-4-turbo': {
    maxTokens: 16384,
    temperature: 0.7,
    topP: 1,
    provider: 'openai'
  },
  
  // GPT-3.5 Models
  'gpt-3.5-turbo': {
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1,
    provider: 'openai'
  },
  'gpt-3.5-turbo-16k': {
    maxTokens: 16384,
    temperature: 0.7,
    topP: 1,
    provider: 'openai'
  }
};

module.exports = {
  AI_MODELS,
  DEFAULT_MODEL,
  MODEL_CATEGORIES,
  MODEL_CONFIGS
};