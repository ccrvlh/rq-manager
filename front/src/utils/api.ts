import { config } from "@/config";
import axios, { AxiosResponse, RawAxiosResponseHeaders } from "axios";

export class APIResponse<T> {
  public data: T;
  public status: number;
  public headers: RawAxiosResponseHeaders;
  public response: AxiosResponse;

  constructor(data: T, status: number, response: AxiosResponse) {
    this.data = data;
    this.status = status;
    this.headers = response.headers;
    this.response = response;
  }

  public toJSON() {
    return {
      data: this.data,
      status: this.status,
    };
  }
}

export class APIError extends Error {
  public status: number;
  public code: string;
  public details: unknown;

  constructor(
    status: number,
    message: string,
    code: string,
    details: unknown = null,
    stack: string | null = null
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;

    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// Create axios instance
const apiClient = axios.create({
  baseURL: config.API_URL || "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const apiError = new APIError(
        error.response.status,
        error.response.data?.message || error.message,
        error.response.data?.code || "UNKNOWN_ERROR",
        error.response.data
      );
      return Promise.reject(apiError);
    }
    return Promise.reject(error);
  }
);

export const api = apiClient;
