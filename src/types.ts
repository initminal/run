export type EvalResult =
  | { success: true; value: unknown }
  | { success: false; error: InitminalEvalError }

export type InitminalEvalError =
  | { kind: 'error-eval-timeout' }
  | { kind: 'error-eval-runtime'; error: Error | string }
  | { kind: 'error-eval-get-dependencies'; error: Error | string }

export type EncodeType = 'Blob' | 'UTF-8'

export type Config = {
  /** a list of JS objects that are whitelisted for the untrusted code to access.
   * @defaultValue `defaultSafeObjects` */
  whitelists?: string[]
  /** strategy to encode data to URL
   * @defaultValue `UTF-8` for Node.js and `Blob` for browser. */
  encodeStrategy?: EncodeType
}

/** @internal */
export type InternalWorkerConfig = {
  whitelists: ReadonlyArray<string>
  encodeStrategy: EncodeType
}

export type InitminalRun = {
  /**
   * @param code the code to be evaluated
   * @param dependecies list of dependencies that are imported by the provided code, can be data: or http: URL, or plain JS code
   * @param arg the argument to be passed to the function if `callTarget` is a function. Ignored if `callTarget` is not a function.
   * @param callTarget the name of the export to be called (if it is a function) or returned directly (it if is a value). If the export is a Promise (or a function returning a Promise), it will be awaited until the value is resolved and returned. Defaults to `initminal`.
   * @param timeout how long the code is allow to run before it is terminated. Defaults to 3 seconds
   * @returns output of code execution
   */
  run: (
    code: string,
    dependencies?: Record<string, string>,
    arg?: unknown,
    callTarget?: string,
    timeout?: number
  ) => Promise<EvalResult>
  /**
   * similar to `run`, but throws an error if the execution
   * fails
   */
  runMightThrow: (
    code: string,
    dependencies?: Record<string, string>,
    arg?: unknown,
    callTarget?: string,
    timeout?: number
  ) => Promise<unknown>
  /** terminate the underlying worker */
  terminate: () => void
}
