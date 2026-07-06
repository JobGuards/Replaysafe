import * as Sentry from "@sentry/node";

export const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn("SENTRY_DSN not provided. Sentry is disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });
};
