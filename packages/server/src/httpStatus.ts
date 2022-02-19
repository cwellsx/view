export interface HttpStatus {
  httpStatus: number;
}

export function isHttpStatus(result: HttpStatus | any): result is HttpStatus {
  return (result as HttpStatus).httpStatus !== undefined;
}
