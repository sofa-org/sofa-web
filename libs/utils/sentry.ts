import {
  Dedupe as DedupeIntegration,
  ExtraErrorData as ExtraErrorDataIntegration,
  Offline as OfflineIntegration,
} from '@sentry/integrations';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { isEqual } from 'lodash-es';

import { Env } from './env';
import { currQuery } from './history';

const enable = Env.isProd || currQuery()['enable-sentry'] === '1';

export class CSentry {
  constructor() {
    this.init();
  }

  private init() {
    if (!enable) return null;
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new OfflineIntegration(),
        new DedupeIntegration(),
        new ExtraErrorDataIntegration(),
      ],
      release: process.env.VERSION,
      environment: import.meta.env.VITE_ENV || window.location.host,
      ignoreErrors: [
        /waitUntil:\s*timeout/i,
        /Non-Error\s*promise\s*rejection/i,
        /invalid\s*token/i,
        /Request\s*timeout/i,
        /Network\s*Error/i,
        /timeout\s*of\s*\d+ms\s*exceeded/i,
        /code:\s*10002/i,
        /status:\s*404/i,
        /Failed\s*to\s*fetch\s*\(status:\s*4/i,
        /network\s*changed/i,
        /invalid\s*parameter/i,
        /Failed\s*to\s*fetch/i,
        /Failed\s*to\s*switch\s*to\s*network/i,
        /could not coalesce error/i,
        /WebSocket connection failed/i,
        /missing revert data/i,
        /network changed/i,
        /Max return might not cover cost/i,
      ],
      sampleRate: 0.1,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 0.1,
      // beforeSend(event, hint) {     //   // Check if it is an exception, and if so, show the report dialog
      //   if (event.exception) {     //     Sentry.showReportDialog({ eventId: event.event_id });
      //   }
      //   return event;
      // },
    });

    return null;
  }

  user: unknown;
  setUser: typeof Sentry.setUser = (user) => {
    if (isEqual(user, this.user)) return null;
    this.user = user;
    if (enable) return Sentry.setUser(user);
    console.info('--- Sentry SetUser ---', user);
    return 'intercepted';
  };
  captureException: typeof Sentry.captureException = enable
    ? Sentry.captureException
    : (...args) => {
        console.info('--- Sentry CaptureException ---', ...args);
        return 'intercepted';
      };
}

export const sentry = new CSentry();
