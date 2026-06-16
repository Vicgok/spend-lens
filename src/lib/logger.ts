type LoggerContext = Record<string, unknown>;

function formatContext(context?: LoggerContext) {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }

  return ` ${JSON.stringify(context)}`;
}

function writeConsole(method: 'warn' | 'error', message: string, context?: LoggerContext) {
  console[method](`${message}${formatContext(context)}`);
}

export const logger = {
  debug(message: string, context?: LoggerContext) {
    if (__DEV__) {
      console.log(`${message}${formatContext(context)}`);
    }
  },
  warn(message: string, context?: LoggerContext) {
    writeConsole('warn', message, context);
  },
  error(message: string, context?: LoggerContext) {
    writeConsole('error', message, context);
  },
};
