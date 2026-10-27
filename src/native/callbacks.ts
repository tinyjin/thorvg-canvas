import { getNative } from './binding';

type Callback = (...args: never[]) => unknown;

const callbacks = new Map<number, Callback>();
let nextId = 1;
let installed = false;

function dispatch(id: number, ...args: unknown[]): unknown {
  const callback = callbacks.get(id);
  return callback ? (callback as (...a: unknown[]) => unknown)(...args) : false;
}

export function registerCallback(callback: Callback): number {
  if (!installed) {
    getNative().set_dispatcher(dispatch);
    installed = true;
  }
  const id = nextId++;
  callbacks.set(id, callback);
  return id;
}

export function unregisterCallback(id: number): void {
  callbacks.delete(id);
}
