
const colors = {
  reset: "\x1b[0m",
  info: "\x1b[36m",    
  success: "\x1b[32m", 
  warn: "\x1b[33m",    
  error: "\x1b[31m"    
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta) => {
    console.log(`${colors.info}${formatMessage('info', message, meta)}${colors.reset}`);
  },
  success: (message, meta) => {
    console.log(`${colors.success}${formatMessage('success', message, meta)}${colors.reset}`);
  },
  warn: (message, meta) => {
    console.warn(`${colors.warn}${formatMessage('warn', message, meta)}${colors.reset}`);
  },
  error: (message, error, meta) => {
    const errorDetails = error ? ` | Error: ${error.message}\nStack: ${error.stack}` : '';
    console.error(`${colors.error}${formatMessage('error', message, meta)}${errorDetails}${colors.reset}`);
  }
};
