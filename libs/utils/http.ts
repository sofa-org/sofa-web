import { wait } from '@livelybone/promise-wait';
import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios';
import axiosRetry from 'axios-retry';
import { noop } from 'lodash-es';

import { getErrorMsg, isTwoStringSame, jsonSafeParse } from './fns';
import { sentry } from './sentry';
import { UserStorage } from './storage';

export const AuthToken = new UserStorage<string>(
  'auth',
  () =>
    jsonSafeParse(localStorage.getItem('wallet-info'), {
      state: { address: '' },
    })?.state?.address || '',
);

// const codeMessage = {
//   200: '服务器成功返回请求的数据。',
//   201: '新建或修改数据成功。',
//   202: '一个请求已经进入后台排队（异步任务）。',
//   204: '删除数据成功。',
//   400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
//   401: '用户没有权限（令牌、用户名、密码错误）。',
//   403: '用户得到授权，但是访问是被禁止的。',
//   404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
//   406: '请求的格式不可得。',
//   410: '请求的资源被永久删除，且不会再得到的。',
//   422: '当创建一个对象时，发生一个验证错误。',
//   500: '服务器发生错误，请检查服务器。',
//   502: '网关错误。',
//   503: '服务不可用，服务器暂时过载或维护。',
//   504: '网关超时。',
// };
// const codeMessage: Record<string, string> = {
//   200: 'The server successfully returned the requested data.',
//   201: 'Data is created or modified successfully.',
//   202: 'A request has been queued in the background (asynchronous task).',
//   204: 'Succeeded in deleting data.',
//   400: 'The server did not create or modify data.',
//   401: 'User does not have permission (wrong token, username, password).',
//   403: 'The user is authorized, but access is prohibited.',
//   404: 'The request was made for a nonexistent record, and the server did not act on it.',
//   406: 'The requested format is not available.',
//   410: 'The requested resource is permanently deleted and will not be retrieved.',
//   422: 'A validation error occurred while creating an object.',
//   500: 'An error occurred on the server. Check the server.',
//   502: 'Gateway error.',
//   503: 'The service is unavailable, the server is temporarily overloaded or maintained.',
//   504: 'The gateway timed out.',
// };

/** 异常处理程序 */
function httpErrorHandler(error: AxiosError<HttpResponse>) {
  const { config, response, request } = error;
  const url = config?.url || request?.options?.url || request?.url;
  const status = response?.status;
  const code = response?.data?.code;
  const statusText = response?.statusText;
  const message = !status
    ? error.message || 'Network connection failed...'
    : response?.data?.message || error.message;
  Object.assign(error, {
    url,
    code,
    status,
    statusText,
    params: JSON.stringify(config?.params),
    data: JSON.stringify(config?.data),
    message,
  });
  return Promise.reject(error);
}

function applyAxiosRetry(
  http: AxiosInstance,
  beforeRetry: (
    error: AxiosError<unknown, unknown>,
  ) => void | boolean | Promise<void | boolean> = noop,
  onRetry: (
    retryCount: number,
    error: AxiosError<unknown, unknown>,
    requestConfig: AxiosRequestConfig<unknown>,
  ) => void = noop,
) {
  axiosRetry(http, {
    shouldResetTimeout: true,
    retries: 3,
    retryDelay: () => 500,
    onRetry,
    retryCondition: async (err) => {
      const config = err.config || err.response?.config;
      if (config?.method && !isTwoStringSame(config.method, 'get'))
        return false;
      if (
        !(
          !err.response ||
          err.response.status >= 400 ||
          /timeout|connection|proxy|bad gateway|internal system/i.test(
            getErrorMsg(err.response.data),
          )
        )
      )
        return false;
      const shouldRetry = await beforeRetry?.(err);
      if (shouldRetry === false) return false;
      return true;
    },
  });
}

const http = axios.create({
  baseURL: [import.meta.env.VITE_BACKEND, '/']
    .join('///')
    .replace(/\/{3,}/, '/'),
  // 默认请求是否带上cookie
  withCredentials: false,
  timeout: 30000,
  transformResponse: (d, _, status) => {
    if (d instanceof Blob) return d;
    const data = jsonSafeParse(d, {} as Record<string, unknown>);
    if ('code' in data && 'value' in data) return data;
    if (status && (status < 200 || status >= 300))
      return { status, code: 1, message: `status-${status}`, value: data };
    return { status, code: 0, value: data };
  },
});

http.interceptors.request.use(async (options: AxiosRequestConfig) => {
  const headers = new AxiosHeaders(options.headers as AxiosHeaders);
  const finalUri = axios.getUri(options);
  const auth = AuthToken.get();
  if (auth && /(^|\.)sofa\.org$|localhost/i.test(new URL(finalUri).hostname)) {
    // only send Authorization header to subdomain of sofa.org
    headers.set('Authorization', `Bearer ${auth}`);
  }
  if (/(^|\.)sofa\.org$|localhost/i.test(new URL(finalUri).hostname)) {
    options.withCredentials = true;
  }
  // if (options.url?.includes('/sofa')) {
  //   headers.set('Device-Id', await Env.deviceID);
  //   headers.set('Trace-Id', nanoid());
  //   headers.set('Front-Version', Env.version);
  // }
  return { ...options, headers };
});

type ErrorObj = {
  response?: {
    data: {
      code: number;
      message: string;
    };
  };
  request?: {
    responseURL?: string;
    url?: string;
  };
} & Error;

http.interceptors.response.use(async (res) => {
  const response = ('response' in res && (res.response as typeof res)) || res;
  const options = response.config;
  const { data } = response;
  if (data instanceof Blob) return data;
  if (data.code !== 0) {
    const error = new Error(getErrorMsg(data) || 'Unknown error');
    const url = [options.baseURL, options.url].filter(Boolean).join('');
    Object.assign(error, {
      params: JSON.stringify(options.params),
      data: JSON.stringify(options.data),
      code: data.code,
      response: {
        ...response,
        status: response.status,
        statusText: response.statusText,
        data,
      },
      request: {
        options,
        url,
        responseURL: url,
      },
    });
    throw error;
  }
  return { ...response.data, response: response };
});

type ErrorHandler = (err: ErrorObj) => Promise<Error | undefined> | undefined;

const errorHandlers: ErrorHandler[] = [];
export function addHttpErrorHandler(errorHandler: ErrorHandler) {
  errorHandlers.push(errorHandler);
}

http.interceptors.response.use(undefined, async (error) => {
  for (const handler of errorHandlers) {
    const result = await handler(error);
    if (result !== undefined) {
      return Promise.reject(result);
    }
  }
  return httpErrorHandler(error).catch((err) => {
    if (err.status) {
      const msg = String(getErrorMsg(err)).replace(
        new RegExp(`^(${err.url}\\s*)?`),
        err.url + ' ',
      );
      const fetchErr: Error & { cause?: unknown } = new Error(
        `Failed to fetch (status: ${err.status}, code: ${err.code}): ${msg}`,
      );
      fetchErr.cause = err;
      sentry.captureException(fetchErr, { level: 'warning' });
    }
    return Promise.reject(err);
  });
});

applyAxiosRetry(http);

export { http };

/**
 * count 从 1 开始
 * */
export async function pollingUntil<T>(
  api: (count: number, preRes?: T) => Promise<T>,
  until: (lastRes: T, count: number, resList: T[]) => boolean,
  interval = 0,
) {
  let stop = false;
  let count = 1;
  const resList: T[] = [];
  do {
    const res = await api(count, resList[resList.length - 1]);
    resList.push(res);
    stop = until(res, count, resList);
    count += 1;
    if (interval > 0) await wait(interval);
  } while (!stop);
  return resList;
}

/**
 * count 从 1 开始
 * */
export async function retry<T>(
  api: (count: number, preRes?: T) => Promise<T>,
  until: (lastRes: T, count: number, resList: T[]) => boolean,
  interval = 0,
) {
  let stop = false;
  let count = 1;
  const resList: T[] = [];
  do {
    const res = await api(count, resList[resList.length - 1]);
    resList.push(res);
    stop = until(res, count, resList);
    count += 1;
    if (interval > 0) await wait(interval);
  } while (!stop);
  return resList;
}
