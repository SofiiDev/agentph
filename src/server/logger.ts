export type LogLevel = 'info' | 'warn' | 'error';

export const log = (level: LogLevel, event: string, context: Record<string, unknown>) => {
  const payload = {
    level,
    event,
    at: new Date().toISOString(),
    ...context
  };

  console.log(JSON.stringify(payload));
};
