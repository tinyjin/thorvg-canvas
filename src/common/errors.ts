import type { ErrorHandler } from './types';
import { ThorVGResultCode } from './constants';

export { ThorVGResultCode };

const messages: Record<ThorVGResultCode, string> = {
  [ThorVGResultCode.Success]: 'Success',
  [ThorVGResultCode.InvalidArguments]: 'Invalid arguments',
  [ThorVGResultCode.InsufficientCondition]: 'Insufficient condition',
  [ThorVGResultCode.FailedAllocation]: 'Failed allocation',
  [ThorVGResultCode.MemoryCorruption]: 'Memory corruption',
  [ThorVGResultCode.NotSupported]: 'Not supported',
  [ThorVGResultCode.SystemError]: 'System error',
  [ThorVGResultCode.Unknown]: 'Unknown error',
};

export class ThorVGError extends Error {
  public readonly code: ThorVGResultCode;
  public readonly operation: string;

  constructor(message: string, code: ThorVGResultCode, operation: string) {
    super(message);
    this.name = 'ThorVGError';
    this.code = code;
    this.operation = operation;
  }

  public static fromCode(
    code: ThorVGResultCode,
    operation: string
  ): ThorVGError {
    const message = `TVGERR - ${operation} failed: ${messages[code] ?? 'Unknown error'}`;
    return new ThorVGError(message, code, operation);
  }
}

let globalErrorHandler: ErrorHandler | undefined;

export function setGlobalErrorHandler(handler?: ErrorHandler): void {
  globalErrorHandler = handler;
}

export function checkResult(result: number, operation: string): void {
  if (result === ThorVGResultCode.Success) {
    return;
  }

  const error = ThorVGError.fromCode(result as ThorVGResultCode, operation);

  if (globalErrorHandler) {
    globalErrorHandler(error, { operation });
    return;
  }

  throw error;
}

export function handleError(message: string, operation: string): void {
  const error = new Error(`ERROR - ${operation}: ${message}`);

  if (globalErrorHandler) {
    globalErrorHandler(error, { operation });
    return;
  }

  throw error;
}
