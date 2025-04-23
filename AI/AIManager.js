// AIManager.js
import { ModelClient } from "@azure/ai-inference";
import { CHARACTERS } from './lib/characters.js';
import { AI_MODELS } from './lib/constants.js';

/**
 * AIManager handles interactions with various AI models through the Azure AI Inference API
 */
class AIManager {
  /**
   * Create a new AIManager instance
   * @param {string} githubToken - Authentication token for API access
   * @param {string} endpoint - API endpoint URL
   * @param {string} [defaultModel="gpt-4o"] - Default AI model to use
   * @param {object} [options={}] - Additional configuration options
   * @param {number} [options.cacheSize=100] - Maximum number of responses to cache
   * @param {number} [options.cacheTTL=3600000] - Cache time-to-live in milliseconds (default: 1 hour)
   */
  constructor(githubToken, endpoint, defaultModel = "gpt-4o", options = {}) {
    if (!endpoint) throw new Error("AI endpoint is required");
    
    this.githubToken = githubToken || "";
    this.endpoint = endpoint;
    this.modelList = AI_MODELS;
    this.modelName = this.modelList.includes(defaultModel) ? defaultModel : "gpt-4o";
    
    // Cache configuration
    this.cacheEnabled = options.cacheEnabled !== false;
    this.cacheSize = options.cacheSize || 100;
    this.cacheTTL = options.cacheTTL || 3600000; // Default: 1 hour
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Request configuration defaults
    this.defaultRequestConfig = {
      temperature: options.temperature || 0.5,
      maxTokens: options.maxTokens || 2000,
      topP: options.topP || 1,
    };

    // Initialize client
    this.initClient();
  }

  /**
   * Initialize the AI client
   * @private
   */
  initClient() {
    try {
      this.client = new ModelClient(this.endpoint, {
        getToken: () => Promise.resolve(this.githubToken),
      });
    } catch (error) {
      console.error("Failed to initialize AI client:", error);
      throw new Error(`Failed to initialize AI client: ${error.message}`);
    }
  }

  /**
   * Get the list of available AI models
   * @returns {string[]} Array of model names
   */
  getAvailableModels() {
    return [...this.modelList];
  }

  /**
   * Get the current AI model being used
   * @returns {string} Current model name
   */
  getCurrentModel() {
    return this.modelName;
  }

  /**
   * Change the AI model being used
   * @param {string} model - Name of model to switch to
   * @returns {boolean} True if successful
   * @throws {Error} If model is invalid or not found
   */
  changeAIModel(model) {
    if (!model) throw new Error("Model name is required");
    
    if (this.modelList.includes(model)) {
      this.modelName = model;
      return true;
    }
    throw new Error(`Model "${model}" not found in supported models list`);
  }

  /**
   * Get current formatted date in UTC timezone
   * @returns {string} Formatted date string
   * @private
   */
  getCurrentFormattedDate() {
    return new Date().toLocaleString("en-GB", { timeZone: "UTC" });
  }

  /**
   * Process a template string, replacing variables with actual values
   * @param {string} template - Template string to process
   * @param {object} values - Values to insert into template
   * @returns {string} Processed string
   * @private
   */
  processTemplate(template, values = {}) {
    let result = template;
    
    // Replace ${currentTime} with formatted date
    result = result.replace(/\${currentTime}/g, this.getCurrentFormattedDate());
    
    // Replace ${author} and other variables
    Object.entries(values).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    });
    
    return result;
  }

  /**
   * Clean cache entries older than TTL
   * @private
   */
  cleanCache() {
    const now = Date.now();
    const expiredKeys = [];
    
    // Find expired entries
    this.cacheTimestamps.forEach((timestamp, key) => {
      if (now - timestamp > this.cacheTTL) {
        expiredKeys.push(key);
      }
    });
    
    // Remove expired entries
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    });
  }

  /**
   * Add entry to cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @private
   */
  addToCache(key, value) {
    if (!this.cacheEnabled) return;
    
    // Clean cache if needed
    this.cleanCache();
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.cacheSize) {
      let oldestKey = null;
      let oldestTime = Infinity;
      
      this.cacheTimestamps.forEach((time, key) => {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = key;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.cacheTimestamps.delete(oldestKey);
      }
    }
    
    // Add new entry
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Get list of available characters
   * @returns {string[]} Array of character names
   */
  getAvailableCharacters() {
    return Object.keys(CHARACTERS);
  }

  /**
   * Send a message to the AI using a specific character profile
   * @param {string} message - Message content to send
   * @param {string} author - Name of the author/user
   * @param {string} character - Character profile to use
   * @param {object} [options={}] - Request options
   * @param {number} [options.temperature] - Temperature for response generation
   * @param {number} [options.maxTokens] - Maximum tokens in response
   * @param {number} [options.topP] - Top-p sampling value
   * @param {boolean} [options.useCache=true] - Whether to use cached responses
   * @returns {Promise<string>} AI response
   * @throws {Error} If request fails or parameters are invalid
   */
  async queryAI(message, author, character, options = {}) {
    // Validate inputs
    if (!message) throw new Error("Message is required");
    if (!author) throw new Error("Author is required");
    if (!character) throw new Error("Character is required");
    
    const characterConfig = CHARACTERS[character];
    if (!characterConfig) {
      throw new Error(`Character "${character}" not found`);
    }

    // Cache check
    const cacheKey = `${message}-${author}-${character}-${this.modelName}`;
    if (options.useCache !== false && this.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Process templates
      const systemMessage = this.processTemplate(characterConfig.systemMessage, { author });
      const additionalInfo = this.processTemplate(characterConfig.additionalInfo, { author });

      // Prepare request
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

      // Make API request
      const response = await this.client.path("/chat/completions").post({
        body: requestBody,
      });

      // Handle response
      if (response.status !== 200) {
        throw new Error(`Failed to query AI: ${response.status} ${JSON.stringify(response.body)}`);
      }

      const result = response.body.choices[0].message.content;
      
      // Store in cache
      this.addToCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error querying AI:", error);
      throw error;
    }
  }

  /**
   * Generate embeddings for a text
   * @param {string} text - Text to generate embeddings for
   * @param {string} [model="text-embedding-3-small"] - Embedding model to use
   * @returns {Promise<Array<number>>} Array of embedding values
   * @throws {Error} If request fails
   */
  async generateEmbedding(text, model = "text-embedding-3-small") {
    if (!text) throw new Error("Text is required for embedding generation");
    
    try {
      const response = await this.client.path("/embeddings").post({
        body: {
          input: text,
          model: model,
        },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to generate embedding: ${response.status}`);
      }

      return response.body.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }

  /**
   * Clear the response cache
   * @returns {number} Number of entries cleared
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    this.cacheTimestamps.clear();
    return size;
  }

  /**
   * Update configuration options
   * @param {object} options - Configuration options
   * @param {boolean} [options.cacheEnabled] - Enable/disable cache
   * @param {number} [options.cacheSize] - Maximum cache size
   * @param {number} [options.cacheTTL] - Cache TTL in milliseconds
   * @param {number} [options.temperature] - Default temperature
   * @param {number} [options.maxTokens] - Default max tokens
   * @param {number} [options.topP] - Default top-p value
   */
  updateConfig(options = {}) {
    if (options.cacheEnabled !== undefined) {
      this.cacheEnabled = options.cacheEnabled;
    }
    
    if (options.cacheSize) {
      this.cacheSize = options.cacheSize;
    }
    
    if (options.cacheTTL) {
      this.cacheTTL = options.cacheTTL;
    }
    
    if (options.temperature !== undefined) {
      this.defaultRequestConfig.temperature = options.temperature;
    }
    
    if (options.maxTokens) {
      this.defaultRequestConfig.maxTokens = options.maxTokens;
    }
    
    if (options.topP !== undefined) {
      this.defaultRequestConfig.topP = options.topP;
    }
  }
}

export default AIManager;
