import { config } from "@/config";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "universal-cookie";

export const AUTHORIZATION_HEADER_KEY = "Authorization";
export const COOKIE_AUTH_TOKEN_KEY = "@rq-mgmt-token";
export const COOKIE_AUTH_REFRESH_TOKEN_KEY = "@rq-mgmt-refresh-token";

const cookies = new Cookies();
const authToken = cookies.get(COOKIE_AUTH_TOKEN_KEY);

const api = axios.create({
  baseURL: config.API_URL,
});

if (authToken) {
  api.defaults.headers.common[AUTHORIZATION_HEADER_KEY] = `Bearer ${authToken}`;
}

const onRequest = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  console.debug(`[Request] [${config.method?.toUpperCase()}] ${config.url}`);
  return config;
};

const onRequestError = (error: AxiosError): AxiosError => {
  console.error(`[Request Error] [${error}]`);
  throw error;
};

const onResponse = (response: AxiosResponse): AxiosResponse => {
  console.debug(`[Response] [${response.status}]`);
  return response;
};

const onResponseError = (error: AxiosError) => {
  console.error(`[Response Error] [${error}]`);
  throw error;
};

const setupInterceptors = (axiosInstance: AxiosInstance): AxiosInstance => {
  axiosInstance.interceptors.request.use(onRequest, onRequestError);
  axiosInstance.interceptors.response.use(onResponse, onResponseError);
  return axiosInstance;
};

export const setAuthorization = (token: string) => {
  api.defaults.headers.common[AUTHORIZATION_HEADER_KEY] = `Bearer ${token}`;
};

export const removeAuthorization = () => {
  delete api.defaults.headers.common[AUTHORIZATION_HEADER_KEY];
};

setupInterceptors(api);

export { api };
