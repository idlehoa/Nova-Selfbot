class Logger {
    static levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
  
    static currentLevel = Logger.levels.INFO;
  
    static setLevel(level) {
      this.currentLevel = level;
    }
  
    static formatMessage(level, message, meta = {}) {
      const timestamp = new Date().toISOString();
      const metaString = Object.keys(meta).length 
        ? ` ${JSON.stringify(meta)}`
        : '';
      
      return `[${timestamp}] ${level}: ${message}${metaString}`;
    }
  
    static error(message, meta = {}) {
      if (this.currentLevel >= this.levels.ERROR) {
        console.error(this.formatMessage('ERROR', message, meta));
      }
    }
  
    static warn(message, meta = {}) {
      if (this.currentLevel >= this.levels.WARN) {
        console.warn(this.formatMessage('WARN', message, meta));
      }
    }
  
    static info(message, meta = {}) {
      if (this.currentLevel >= this.levels.INFO) {
        console.info(this.formatMessage('INFO', message, meta));
      }
    }
  
    static debug(message, meta = {}) {
      if (this.currentLevel >= this.levels.DEBUG) {
        console.debug(this.formatMessage('DEBUG', message, meta));
      }
    }
  }
  
  export default Logger;