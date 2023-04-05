import { Either, isLeft, left, match, right } from 'fp-ts/lib/Either'
import { get } from 'lodash'
// @ts-expect-error no definition file from 'web-worker' library
import Worker from 'web-worker'
import { defaultSafeObjects, minSafeObjects } from './config'
import {
  Config,
  EncodeType,
  InitminalEvalError,
  EvalResult,
  InitminalRun,
  InternalWorkerConfig,
} from './types'
import {
  encode,
  findMatchingModuleNames,
  transformHttpUrlForNodeJsCompatability,
  transformModuleNameToUrls,
} from './utils'
import { workerScript } from './webWorkerScript'

function fromEither<T, U>(input: Either<T, U>): U {
  if (isLeft(input)) {
    throw new Error(JSON.stringify(input.left))
  }
  return input.right
}

const killWorker = (worker: Worker) => worker.terminate()

type WorkerMessage =
  | { kind: 'error'; message: Error | string }
  | { kind: 'success'; result: unknown }

const errorObjOrString = (err: unknown): Error | string =>
  err instanceof Error ? err : String(err)

export const evalAsync =
  (worker: Worker) =>
  (timeout: number) =>
  (
    codeUrl: string,
    arg: Arg,
    callTarget: string
  ): Promise<Either<InitminalEvalError, unknown>> => {
    return new Promise((resolve) => {
      const handle = setTimeout(() => {
        resolve(left({ kind: 'error-eval-timeout' }))
      }, timeout)

      worker.postMessage({ codeUrl, arg, callTarget })

      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        clearTimeout(handle)
        if (e.data.kind === 'success') {
          resolve(right(e.data.result))
        }
        if (e.data.kind === 'error') {
          resolve(left({ kind: 'error-eval-runtime', error: e.data.message }))
        }
        resolve(
          left({ kind: 'error-eval-runtime', error: JSON.stringify(e.data) })
        )
      }

      worker.onerror = (e: ErrorEvent) => {
        clearTimeout(handle)
        resolve(left({ kind: 'error-eval-runtime', error: JSON.stringify(e) }))
      }
    })
  }

const fillTemplate = (str: string, safeObjects: string) =>
  str.replace('{{safe-objects}}', safeObjects)

const createWorker = (config: InternalWorkerConfig): Worker => {
  return new Worker(
    encode(
      fillTemplate(workerScript, JSON.stringify(config.whitelists)),
      config.encodeStrategy
    ),
    { type: 'module' }
  )
}

export type Dependencies = Record<string, string>

const isNodeJs = !!process?.versions?.node

/**
 * the argument to be provided when calling the function
 * in user's code (if the export is a function)
 */
type Arg = unknown

type Queue = {
  code: string
  dependecies: Dependencies
  arg: Arg
  callTarget: string
  timeout: number
  resolve: (
    value:
      | Either<InitminalEvalError, unknown>
      | PromiseLike<Either<InitminalEvalError, unknown>>
  ) => void
}

const ENCODE_DEFAULT_STRATEGY: EncodeType = isNodeJs ? 'UTF-8' : 'Blob'

/**
 * Create an instance of InitminalRun.
 * @param config - config for creating an instance of InitminalRun.
 * @returns an instance of InitminalRun.
 */
export const createInitminalRun = (config?: Config): InitminalRun => {
  let worker: Worker | null = null
  let workerBusy = false
  const queue: Array<Queue> = []

  const executeJob = async (
    code: string,
    dependecies: Dependencies,
    arg: Arg,
    callTarget: string,
    timeout: number
  ): Promise<Either<InitminalEvalError, unknown>> => {
    const encodeStrategy = config?.encodeStrategy || ENCODE_DEFAULT_STRATEGY

    if (!worker) {
      const workerConfig: InternalWorkerConfig = {
        whitelists: config?.whitelists
          ? [...minSafeObjects, ...config.whitelists]
          : defaultSafeObjects,
        encodeStrategy,
      }
      worker = createWorker(workerConfig)
    }

    try {
      const pkgs = findMatchingModuleNames(code)
      for (const pkg of pkgs) {
        const URL = get(dependecies, pkg)

        if (typeof URL !== 'string') {
          return left({
            kind: 'error-eval-get-dependencies',
            error: `No URL found for ${pkg}`,
          })
        }
      }
    } catch (e) {
      return left({
        kind: 'error-eval-get-dependencies',
        error: errorObjOrString(e),
      })
    }

    const codeUrl: string = encode(
      isNodeJs
        ? await transformHttpUrlForNodeJsCompatability(
            transformModuleNameToUrls(dependecies, code, encodeStrategy)
          )
        : transformModuleNameToUrls(dependecies, code, encodeStrategy),
      encodeStrategy
    )

    const result = await evalAsync(worker)(timeout)(codeUrl, arg, callTarget)
    URL.revokeObjectURL(codeUrl)
    if (isLeft(result) && result.left.kind === 'error-eval-timeout') {
      killWorker(worker)
      worker = null
    }
    return result
  }

  const processTasksInQueue = async () => {
    if (workerBusy) return
    const next = queue.shift()
    if (!next) return

    workerBusy = true
    const { code, dependecies, arg, callTarget, timeout, resolve } = next
    const result = await executeJob(code, dependecies, arg, callTarget, timeout)
    resolve(result)
    workerBusy = false

    processTasksInQueue()
  }

  const _run = (
    code: string,
    dependecies: Dependencies = {},
    arg: Arg = undefined,
    callTarget = 'initminal',
    timeout = 3 * 1000
  ) =>
    new Promise<Either<InitminalEvalError, unknown>>((resolve) => {
      queue.push({ code, dependecies, arg, callTarget, timeout, resolve })
      processTasksInQueue()
    })

  return {
    /**
     * Create an instance of InitminalRun.
     * @param dependencies - confasdfan instance of InitminalRun.
     * @returns an instance of InitminalRun.
     */
    run: async (...args) =>
      match<InitminalEvalError, unknown, EvalResult>(
        (error) => ({ success: false, error }),
        (result) => ({ success: true, value: result })
      )(await _run(...args)),
    /** @type {run} */
    runMightThrow: async (...args) => fromEither(await _run(...args)),
    terminate: () => {
      if (worker) {
        killWorker(worker)
        worker = null
      }
    },
  }
}
