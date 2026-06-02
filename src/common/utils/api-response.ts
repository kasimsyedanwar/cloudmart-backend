export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data?: T;
  requestId?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  code: string;
  requestId?: string;
  details?: unknown;
};

export const successResponse = <T>({
  message,
  data,
  requestId,
}: {
  message: string;
  data?: T;
  requestId?: string;
}): ApiSuccessResponse<T> => {
  return {
    success: true,
    message,
    data,
    requestId,
  };
};
