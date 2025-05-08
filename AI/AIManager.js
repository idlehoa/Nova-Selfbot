const { CHARACTERS } = require('./lib/characters.js');
const { AI_MODELS } = require('./lib/constants.js');
const { loadSpecialAlgorithms } = require('./special/index.js');
const config = require('./config.js');

class AIError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

class AIManager {
  constructor(options = {}) {
    this.validateAndInitialize(options);
    this.initializeCache();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastError: null,
    };
  }

  validateAndInitialize(options) {
    // Core configuration
    this.githubToken = options.githubToken || config.GITHUB_TOKEN;
    this.endpoint = (options.endpoint || config.AI_ENDPOINT).replace(/\/$/, '');
    this.modelList = AI_MODELS;
    this.modelName = this.validateModel(options.defaultModel || config.DEFAULT_MODEL);
    
    // DeepSeek configuration
    this.deepseekEnabled = options.deepseekEnabled || false;
    if (this.deepseekEnabled) {
      this.deepseekApiKey = options.deepseekApiKey;
      this.deepseekEndpoint = (options.deepseekEndpoint || "https://api.deepseek.com/v1").replace(/\/$/, '');
      if (!this.deepseekApiKey) {
        throw new AIError('DeepSeek API key is required when DeepSeek is enabled', 'CONFIG_ERROR');
      }
    }
    
    // Request configuration
    this.defaultRequestConfig = {
      temperature: options.temperature || config.DEFAULT_TEMPERATURE,
      maxTokens: options.maxTokens || config.DEFAULT_MAX_TOKENS,
      topP: options.topP || config.DEFAULT_TOP_P,
    };

    // Retry configuration
    this.retryAttempts = options.retryAttempts || config.RETRY_ATTEMPTS;
    this.retryDelay = options.retryDelay || config.RETRY_DELAY;

    // Special algorithms
    this.specialAlgorithms = [];
    this.specialLoaded = false;
  }

  initializeCache() {
    this.cacheEnabled = config.CACHE_ENABLED;
    this.cacheSize = config.CACHE_SIZE;
    this.cacheTTL = config.CACHE_TTL;
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

  validateModel(model) {
    if (!this.modelList.includes(model)) {
      throw new AIError(
        `Model "${model}" not found in supported models list: ${this.modelList.join(', ')}`,
        'INVALID_MODEL'
      );
    }
    return model;
  }

  async ensureSpecialLoaded() {
    if (!this.specialLoaded) {
      try {
        this.specialAlgorithms = await loadSpecialAlgorithms();
        this.specialLoaded = true;
      } catch (error) {
        throw new AIError(
          'Failed to load special algorithms',
          'SPECIAL_LOAD_ERROR',
          error
        );
      }
    }
  }

  getAvailableModels() {
    return [...this.modelList];
  }

  getCurrentModel() {
    return this.modelName;
  }

  changeAIModel(model) {
    this.modelName = this.validateModel(model);
    return true;
  }

  getCurrentFormattedDate() {
    return new Date().toISOString();
  }

  processTemplate(template, values = {}) {
    try {
      let result = template;
      const defaultValues = {
        currentTime: this.getCurrentFormattedDate(),
        ...values
      };

      Object.entries(defaultValues).forEach(([key, value]) => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        result = result.replace(regex, value);
      });

      return result;
    } catch (error) {
      throw new AIError(
        'Template processing failed',
        'TEMPLATE_ERROR',
        error
      );
    }
  }

  cleanCache() {
    const now = Date.now();
    [...this.cacheTimestamps.entries()]
      .filter(([_, timestamp]) => now - timestamp > this.cacheTTL)
      .forEach(([key]) => {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      });
  }

  addToCache(key, value) {
    if (!this.cacheEnabled) return;
    
    this.cleanCache();

    if (this.cache.size >= this.cacheSize) {
      const oldestKey = [...this.cacheTimestamps.entries()]
        .reduce((a, b) => a[1] < b[1] ? a : b)[0];
      
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }

    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  getAvailableCharacters() {
    return Object.keys(CHARACTERS);
  }

  async queryAI(message, author, character, options = {}) {
    try {
      this.metrics.totalRequests++;
      await this.ensureSpecialLoaded();
      this.validateQueryParams(message, author, character);

      const characterConfig = this.getCharacterConfig(character);
      const cacheKey = this.generateCacheKey(message, author, character);

      if (this.shouldUseCache(options, cacheKey)) {
        this.metrics.cacheHits++;
        return this.cache.get(cacheKey);
      }

      this.metrics.cacheMisses++;
      const aiReply = await this.makeRetryableRequest(message, author, characterConfig, options);
      const finalReply = await this.processSpecialAlgorithms(message, aiReply);

      this.addToCache(cacheKey, finalReply);
      this.metrics.successfulRequests++;
      return finalReply;

    } catch (error) {
      this.metrics.failedRequests++;
      this.metrics.lastError = {
        timestamp: new Date().toISOString(),
        error: error.message,
        code: error.code
      };
      throw new AIError(
        'AI query failed',
        'QUERY_ERROR',
        error
      );
    }
  }

  validateQueryParams(message, author, character) {
    if (!message?.trim()) throw new AIError('Message is required and cannot be empty', 'INVALID_PARAMS');
    if (!author?.trim()) throw new AIError('Author is required and cannot be empty', 'INVALID_PARAMS');
    if (!character?.trim()) throw new AIError('Character is required and cannot be empty', 'INVALID_PARAMS');
  }

  getCharacterConfig(character) {
    const config = CHARACTERS[character];
    if (!config) {
      throw new AIError(`Character "${character}" not found`, 'INVALID_CHARACTER');
    }
    return config;
  }

  generateCacheKey(message, author, character) {
    return `${message}-${author}-${character}-${this.modelName}`;
  }

  shouldUseCache(options, cacheKey) {
    return options.useCache !== false && 
           this.cacheEnabled && 
           this.cache.has(cacheKey);
  }

  async makeRetryableRequest(message, author, characterConfig, options) {
    let lastError = null;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const aiReply = await this.fetchAIResponse(message, author, characterConfig, options);
        return aiReply;
      } catch (error) {
        lastError = error;
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    throw lastError;
  }

  async fetchAIResponse(message, author, characterConfig, options) {
    const systemMessage = this.processTemplate(characterConfig.systemMessage, { author });
    const additionalInfo = this.processTemplate(characterConfig.additionalInfo, { author });

    const requestBody = {
      messages: [
        { role: "system", content: systemMessage },
        { role: "system", content: additionalInfo },
        { role: "user", content: `${author}: ${message}` },
      ],
      temperature: options.temperature || this.defaultRequestConfig.temperature,
      max_tokens: options.maxTokens || this.defaultRequestConfig.maxTokens,
      top_p: options.topP || this.defaultRequestConfig.topP,
      model: this.modelName,
    };

    const response = await this.makeAPIRequest(requestBody);
    return response.choices[0].message.content;
  }

  async makeAPIRequest(requestBody) {
    if (this.deepseekEnabled) {
      return this.makeDeepSeekRequest(requestBody);
    }

    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new AIError(
        'Invalid JSON response from API',
        'API_RESPONSE_ERROR',
        responseText
      );
    }

    if (!response.ok) {
      throw new AIError(
        `API request failed: ${response.status}`,
        'API_ERROR',
        responseData
      );
    }

    return responseData;
  }

  async makeDeepSeekRequest(requestBody) {
    if (!this.deepseekEnabled || !this.deepseekApiKey) {
      throw new AIError(
        'DeepSeek is not properly configured',
        'DEEPSEEK_CONFIG_ERROR'
      );
    }

    const deepseekBody = {
      ...requestBody,
      stream: false
    };

    const response = await fetch(`${this.deepseekEndpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.deepseekApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(deepseekBody)
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      throw new AIError(
        'Invalid JSON response from DeepSeek API',
        'DEEPSEEK_API_ERROR',
        responseText
      );
    }

    if (!response.ok) {
      throw new AIError(
        `DeepSeek API request failed: ${response.status}`,
        'DEEPSEEK_API_ERROR',
        responseData
      );
    }

    return responseData;
  }

  async processSpecialAlgorithms(message, aiReply) {
    let finalReply = aiReply;
    for (const specialFn of this.specialAlgorithms) {
      if (typeof specialFn === "function") {
        try {
          const processed = await Promise.resolve(specialFn(message, finalReply));
          finalReply = processed || finalReply;
        } catch (error) {
          console.error('Special algorithm processing error:', error);
        }
      }
    }
    return finalReply;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      lastError: null,
    };
  }
}

module.exports = AIManager;