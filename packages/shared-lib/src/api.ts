// this declares a subset of the fields we use from the DOM Response interface
export interface SimpleResponse {
  readonly ok: boolean;
  readonly statusText: string;
  json(): Promise<any>;
}
