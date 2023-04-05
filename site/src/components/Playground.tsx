'use client'

import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night'
import { tokyoNightDay } from '@uiw/codemirror-theme-tokyo-night-day'
import CodeMirror from '@uiw/react-codemirror'
import _ from 'lodash'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import localFont from 'next/font/local'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCopyToClipboard, useDebounce, useMedia } from 'react-use'
import { createInitminalRun, defaultSafeObjects } from '../../../dist/'
import {
  EvalResult,
  InitminalEvalError,
  InitminalRun,
} from '../../../dist/types'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { EditorView } from '@codemirror/view'
import { encode, decode } from 'js-base64'
import { z } from 'zod'

// workng around withc loading `Source_Code_Pro({ subsets: ['latin'] })` with from `next/font/google`, likely due to subpath
const srcCodePro = localFont({
  src: './SourceCodePro.woff2',
})

const dependecies = {
  lodash: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm',
  'config-in-plain-js': 'export const isAscending = true',
  'my-sort-lib-in-encoded-url': `data:text/javascript;charset=utf-8,${encodeURIComponent(
    'export const compareFn = (a, b) => a.localeCompare(b)'
    // or "data:text/javascript;base64," + btoa('export const compareFn = (a, b) => a.localeCompare(b)')
  )}`,
}

const defCode = `import _ from 'lodash'
import { isAscending } from 'config-in-plain-js'
import { compareFn } from 'my-sort-lib-in-encoded-url'

export const initminal = (arr) => 
  _.zip(...arr)
   .map(([name, money]) => ({ name, money }))
   .sort((a, b) => (isAscending ? 1 : -1) * compareFn(a.name, b.name))
   .reduce((prev, { name, money }) => prev + \`\\n* \${name} spends $\${money}\`, "List (sort by name):")`

const defArgs = '[["Zoe", "Alice", "Daemon"], [3, 9, 7]]'

const useThrottle = <T,>(value: T, limit: number) => {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(function () {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

const JSONsafeParse = (str: string) => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

const Data = z.object({
  version: z.literal(1),
  code: z.string(),
  deps: z.string(),
  args: z.string(),
  whitelists: z.string(),
  options: z.object({
    collapseDeps: z.boolean(),
    collapseWhitelists: z.boolean(),
    collapseCode: z.boolean(),
  }),
})

type Data = z.infer<typeof Data>

const createQueryString = (name: string, value: string) => {
  const params = new URLSearchParams()
  params.set(name, value)
  return params.toString()
}

export const CodeRunnerMinimumForFrontPage = () => {
  const isPreferDark = useMedia('(prefers-color-scheme: dark)')

  const [code, setCode] = useState(defCode)
  const [jsonDeps, setJsonDeps] = useState(JSON.stringify(dependecies, null, 2))
  const [args, setArgs] = useState(defArgs)

  const [collapseDeps, setCollapseDependencies] = useState(false)
  const [collapseCode, setCollapseCode] = useState(false)

  const initminalRunRef = useRef(
    createInitminalRun({
      whitelists: [...defaultSafeObjects],
    })
  )
  const initminalRun = initminalRunRef.current

  const [result, setResult] = useState<EvalResult>({
    success: true,
    value: '',
  })

  const throttledCode = useThrottle(code, 3000)
  const throttledJsonDeps = useThrottle(jsonDeps, 3000)
  const throttledArgs = useThrottle(args, 3000)

  useEffect(() => {
    ;(async () => {
      if (!throttledCode) return
      try {
        const result = await initminalRun?.run(
          throttledCode,
          JSON.parse(throttledJsonDeps),
          JSON.parse(throttledArgs)
        )
        if (!result) return
        setResult(result)
      } catch (e) {
        console.error(e)
        setResult({
          success: false,
          error: {
            kind: 'error-eval-runtime',
            error: e instanceof Error ? e : JSON.stringify(e),
          },
        })
      }
    })()
  }, [throttledCode, throttledJsonDeps, throttledArgs, initminalRun])

  const onChangeCode = useCallback((value: string) => {
    setCode(value)
  }, [])

  const onChangeArgs = useCallback((value: string) => {
    setArgs(value)
  }, [])

  const onChangeJson = useCallback((value: string) => {
    setJsonDeps(value)
  }, [])

  const theme = isPreferDark ? tokyoNight : tokyoNightDay
  return (
    <>
      <div id="accordion-collapse" data-accordion="open">
        <h2 id="accordion-collapse-heading-2">
          <button
            type="button"
            className="flex items-center justify-between w-full px-5 py-2 font-medium text-left text-gray-500 border border-b-0 border-gray-200 rounded-t-lg focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            data-accordion-target="#accordion-collapse-body-2"
            aria-expanded={!collapseDeps}
            aria-controls="accordion-collapse-body-2"
            onClick={() => setCollapseDependencies((x) => !x)}
          >
            <span>Dependencies</span>
            <svg
              data-accordion-icon
              className={`w-6 h-6 ${
                !collapseDeps ? 'rotate-180' : ''
              } shrink-0`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </h2>
        <div
          id="accordion-collapse-body-2"
          className={collapseDeps ? 'hidden' : ''}
          aria-labelledby="accordion-collapse-heading-2"
        >
          <div className="h-[7rem] w-full bg-[#e1e2e7] dark:bg-[#1a1b26] border border-t-0 border-gray-200 dark:border-gray-700">
            <CodeMirror
              value={jsonDeps}
              height="7rem"
              extensions={[json(), EditorView.lineWrapping]}
              onChange={onChangeJson}
              theme={theme}
            />
          </div>
        </div>
      </div>

      <h2 id="accordion-collapse-heading-3">
        <button
          type="button"
          className="flex items-center justify-between w-full py-2 px-5 font-medium text-left text-gray-500 border border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          data-accordion-target="#accordion-collapse-body-2"
          aria-expanded={!collapseDeps}
          aria-controls="accordion-collapse-body-2"
          onClick={() => setCollapseCode((x) => !x)}
        >
          <span>Code</span>
          <svg
            data-accordion-icon
            className={`w-6 h-6 ${!collapseCode ? 'rotate-180' : ''} shrink-0`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </h2>
      <div
        id="accordion-collapse-body-3"
        className={collapseCode ? 'hidden' : ''}
        aria-labelledby="accordion-collapse-heading-3"
      >
        <div className="w-full h-[11rem] border border-gray-300 bg-[#e1e2e7] dark:bg-[#1a1b26] dark:border-gray-700 overflow-hidden">
          <CodeMirror
            value={code}
            height="11rem"
            extensions={[javascript(), EditorView.lineWrapping]}
            onChange={onChangeCode}
            theme={theme}
          />
        </div>
      </div>
      <h2 className="flex items-center justify-between w-full px-5 py-2 font-medium text-left text-gray-500 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:text-gray-400">
        Input
      </h2>
      <div className="w-full h-[2rem] border border-gray-300 bg-[#e1e2e7] dark:bg-[#1a1b26] dark:border-gray-700 overflow-hidden">
        <CodeMirror
          value={args}
          height="2rem"
          extensions={[json(), EditorView.lineWrapping]}
          onChange={onChangeArgs}
          theme={theme}
        />
      </div>
      <h2 className="flex items-center justify-between w-full px-5 py-2 font-medium text-left text-gray-500 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:text-gray-400">
        Output
      </h2>

      <div
        className={`py-2 px-2 w-full mb-8 border ${
          result.success
            ? 'border-gray-300 dark:border-gray-700'
            : 'border-red-300 dark:border-red-400'
        } bg-[#e1e2e7] dark:bg-[#1a1b26] rounded-b-lg overflow-hidden`}
      >
        {printResult(result)}
      </div>
    </>
  )
}

const defaultData: Data = {
  version: 1,
  code: defCode,
  deps: JSON.stringify(dependecies, null, 2),
  args: defArgs,
  whitelists: JSON.stringify(defaultSafeObjects, null, 2),
  options: {
    collapseDeps: true,
    collapseCode: false,
    collapseWhitelists: true,
  },
}

export const CodeRunner = ({ shareRefresh }: { shareRefresh: number }) => {
  const [{ value, error }, copyToClipboard] = useCopyToClipboard()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()!

  const isPreferDark = useMedia('(prefers-color-scheme: dark)')

  const [code, setCode] = useState('')
  const [jsonDeps, setJsonDeps] = useState('')
  const [args, setArgs] = useState('')
  const [whitelists, setWhiteLists] = useState('')

  const [collapseWhitelists, setCollapseWhitelist] = useState(true)
  const [collapseDeps, setCollapseDependencies] = useState(false)
  const [collapseCode, setCollapseCode] = useState(false)

  const queryParamIsReadRef = useRef(false)

  const [initminalRun, setInitminalRun] = useState<InitminalRun | null>(null)

  const [result, setResult] = useState<EvalResult>({
    success: true,
    value: '',
  })

  if (!queryParamIsReadRef.current) {
    let data: Data = defaultData
    if (searchParams?.has('data')) {
      try {
        data = Data.parse(JSON.parse(decode(searchParams.get('data')!)))
      } catch (e) {
        console.error(e)
      }
    }
    setCollapseCode(data.options.collapseCode)
    setCollapseDependencies(data.options.collapseDeps)
    setCollapseWhitelist(data.options.collapseWhitelists)
    setCode(data.code)
    setJsonDeps(data.deps)
    setWhiteLists(data.whitelists)
    setArgs(data.args)
    const _initminalRun = createInitminalRun({
      whitelists: JSON.parse(data.whitelists),
    })
    setInitminalRun(_initminalRun)
    ;(async () => {
      if (!data.code) return
      try {
        const result = await _initminalRun.run(
          data.code,
          JSON.parse(data.deps),
          JSON.parse(data.args),
          undefined,
          10000
        )
        if (!result) return
        setResult(result)
      } catch (e) {
        console.error(e)
        setResult({
          success: false,
          error: {
            kind: 'error-eval-runtime',
            error: e instanceof Error ? e : JSON.stringify(e),
          },
        })
      }
    })()
    queryParamIsReadRef.current = true
  }

  const throttledCode = useThrottle(code, 3000)
  const throttledJsonDeps = useThrottle(jsonDeps, 3000)
  const throttledArgs = useThrottle(args, 3000)
  const throttledWhitelist = useThrottle(whitelists, 5000)

  useDebounce(
    () => {
      router.push(
        pathname.replace(/^\/run/, '') +
          '?' +
          createQueryString(
            'data',
            encode(
              JSON.stringify({
                version: 1,
                code: throttledCode,
                deps: throttledJsonDeps,
                args: throttledArgs,
                whitelists: throttledWhitelist,
                options: {
                  collapseCode,
                  collapseDeps,
                  collapseWhitelists,
                },
              })
            )
          )
      )
    },
    5000,
    [
      throttledCode,
      throttledJsonDeps,
      throttledArgs,
      throttledWhitelist,
      pathname,
      router,
      collapseDeps,
      collapseWhitelists,
      collapseCode,
    ]
  )

  const oldWhitelistForDeepCompareRef = useRef(null)
  useEffect(() => {
    if (!initminalRun) return
    const whitelists = JSONsafeParse(throttledWhitelist)
    if (!whitelists) return
    // it is cheaper to do deep object compare than
    // to terminate and re-create the worker
    if (_.isEqual(oldWhitelistForDeepCompareRef.current, whitelists)) return
    oldWhitelistForDeepCompareRef.current = whitelists
    initminalRun.terminate()
    setInitminalRun(
      createInitminalRun({
        whitelists: JSON.parse(throttledWhitelist),
      })
    )
  }, [throttledWhitelist, initminalRun])

  useEffect(() => {
    ;(async () => {
      if (!throttledCode || !throttledJsonDeps || !throttledArgs) return
      try {
        const result = await initminalRun?.run(
          throttledCode,
          JSON.parse(throttledJsonDeps),
          JSON.parse(throttledArgs)
        )
        if (!result) return
        setResult(result)
      } catch (e) {
        console.error(e)
        setResult({
          success: false,
          error: {
            kind: 'error-eval-runtime',
            error: e instanceof Error ? e : JSON.stringify(e),
          },
        })
      }
    })()
  }, [
    throttledCode,
    throttledJsonDeps,
    throttledArgs,
    initminalRun,
    pathname,
    router,
  ])

  const shareRefreshRef = useRef(0)

  useEffect(() => {
    if (shareRefresh === shareRefreshRef.current) return
    shareRefreshRef.current = shareRefresh
    copyToClipboard(
      `https://initminal.com/run/playground/?${createQueryString(
        'data',
        encode(
          JSON.stringify({
            version: 1,
            code: throttledCode,
            deps: throttledJsonDeps,
            args: throttledArgs,
            whitelists: throttledWhitelist,
            options: {
              collapseCode,
              collapseDeps,
              collapseWhitelists,
            },
          })
        )
      )}`
    )
  }, [
    collapseCode,
    collapseDeps,
    collapseWhitelists,
    copyToClipboard,
    shareRefresh,
    throttledArgs,
    throttledCode,
    throttledJsonDeps,
    throttledWhitelist,
  ])

  useEffect(() => {
    if (!value) return
    toast.info('Copied to clipboard.')
  }, [value])

  const onChangeCode = useCallback((value: string) => {
    setCode(value)
  }, [])

  const onChangeArgs = useCallback((value: string) => {
    setArgs(value)
  }, [])

  const onChangeJson = useCallback((value: string) => {
    setJsonDeps(value)
  }, [])

  const onChangeWhitelist = useCallback((value: string) => {
    setWhiteLists(value)
  }, [])

  const theme = isPreferDark ? tokyoNight : tokyoNightDay
  return (
    <>
      <div id="accordion-collapse" data-accordion="open">
        <h2 id="accordion-collapse-heading-1">
          <button
            type="button"
            className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 rounded-t-lg focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            data-accordion-target="#accordion-collapse-body-1"
            aria-expanded={!collapseWhitelists}
            aria-controls="accordion-collapse-body-1"
            onClick={() => setCollapseWhitelist((x) => !x)}
          >
            <span>Whitelisted JS Objects</span>
            <svg
              data-accordion-icon
              className={`w-6 h-6 ${
                !collapseWhitelists ? 'rotate-180' : ''
              } shrink-0`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </h2>
        <div
          id="accordion-collapse-body-1"
          className={collapseWhitelists ? 'hidden' : ''}
          aria-labelledby="accordion-collapse-heading-1"
        >
          <div className="h-80 w-full bg-[#e1e2e7] dark:bg-[#1a1b26] border border-b-0 border-gray-200 dark:border-gray-700">
            <CodeMirror
              value={whitelists}
              height="20rem"
              extensions={[json()]}
              onChange={onChangeWhitelist}
              theme={theme}
            />
          </div>
        </div>
        <h2 id="accordion-collapse-heading-2">
          <button
            type="button"
            className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            data-accordion-target="#accordion-collapse-body-2"
            aria-expanded={!collapseDeps}
            aria-controls="accordion-collapse-body-2"
            onClick={() => setCollapseDependencies((x) => !x)}
          >
            <span>Dependencies</span>
            <svg
              data-accordion-icon
              className={`w-6 h-6 ${
                !collapseDeps ? 'rotate-180' : ''
              } shrink-0`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </h2>
        <div
          id="accordion-collapse-body-2"
          className={collapseDeps ? 'hidden' : ''}
          aria-labelledby="accordion-collapse-heading-2"
        >
          <div className="h-[7rem] w-full bg-[#e1e2e7] dark:bg-[#1a1b26] border border-t-0 border-gray-200 dark:border-gray-700">
            <CodeMirror
              value={jsonDeps}
              height="7rem"
              extensions={[json(), EditorView.lineWrapping]}
              onChange={onChangeJson}
              theme={theme}
            />
          </div>
        </div>
      </div>

      <h2 id="accordion-collapse-heading-3">
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          data-accordion-target="#accordion-collapse-body-2"
          aria-expanded={!collapseDeps}
          aria-controls="accordion-collapse-body-2"
          onClick={() => setCollapseCode((x) => !x)}
        >
          <span>Code</span>
          <svg
            data-accordion-icon
            className={`w-6 h-6 ${!collapseCode ? 'rotate-180' : ''} shrink-0`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </h2>
      <div
        id="accordion-collapse-body-3"
        className={collapseCode ? 'hidden' : ''}
        aria-labelledby="accordion-collapse-heading-3"
      >
        <div className="w-full h-[22rem] mb-2 border border-gray-300 bg-[#e1e2e7] dark:bg-[#1a1b26] dark:border-gray-700 overflow-hidden">
          <CodeMirror
            value={code}
            height="22rem"
            extensions={[javascript(), EditorView.lineWrapping]}
            onChange={onChangeCode}
            theme={theme}
          />
        </div>
      </div>
      <h2 className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:text-gray-400">
        Input
      </h2>
      <div className="w-full h-[8rem] mb-2 border border-gray-300 bg-[#e1e2e7] dark:bg-[#1a1b26] dark:border-gray-700 overflow-hidden">
        <CodeMirror
          value={args}
          height="8rem"
          extensions={[json(), EditorView.lineWrapping]}
          onChange={onChangeArgs}
          theme={theme}
        />
      </div>
      <h2 className="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:text-gray-400">
        Output
      </h2>

      <div
        className={`py-4 px-2 w-full mb-8 border ${
          result.success
            ? 'border-gray-300 dark:border-gray-700'
            : 'border-red-300 dark:border-red-400'
        } bg-[#e1e2e7] dark:bg-[#1a1b26] rounded-b-lg overflow-hidden`}
      >
        {printResult(result)}
      </div>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isPreferDark ? 'dark' : 'light'}
      />
    </>
  )
}

const exhaustiveCheck = (bottom: never) => {
  throw new Error('Unhandled situation: ' + String(bottom))
}

const printErrorTitle = (error: InitminalEvalError) => {
  if (error.kind === 'error-eval-get-dependencies') {
    return `error when resolving dependencies`
  }
  if (error.kind === 'error-eval-runtime') {
    return `runtime error`
  }
  if (error.kind === 'error-eval-timeout') {
    return `running script used too much time`
  }
  return exhaustiveCheck(error)
}

const printError = (error: InitminalEvalError) => {
  return (
    <>
      <div
        className="flex p-4 text-sm text-red-800 dark:text-red-400"
        role="alert"
      >
        <svg
          aria-hidden="true"
          className="flex-shrink-0 inline w-5 h-5 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          ></path>
        </svg>
        <span className="sr-only">Info</span>
        <div>
          <span className="font-medium">{printErrorTitle(error)}</span>
        </div>
      </div>

      {error.kind !== 'error-eval-timeout' && (
        <code
          className={`overflow-x-auto flex p-4 mb-4 text-sm whitespace-pre ${srcCodePro.className} text-gray-800 dark:text-gray-200`}
        >
          {typeof error.error === 'string' ? error.error : error.error.stack}
        </code>
      )}
    </>
  )

  /*   `${printErrorTitle(error)}\n` + JSON.stringify(error, null, 2) */
}

const printSuccessResult = (result: unknown) => {
  return (
    <>
      <div
        className="flex px-4 py-2 text-sm text-green-800 dark:text-green-400"
        role="info"
      >
        <svg
          aria-hidden="true"
          className="flex-shrink-0 inline w-5 h-5 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          ></path>
        </svg>
        <span className="sr-only">Info</span>
        <div>
          <span className="font-medium">Ok!</span>
        </div>
      </div>
      <code
        className={`overflow-x-auto flex px-4 py-2 mb-2 text-sm whitespace-pre ${srcCodePro.className} text-gray-800 dark:text-gray-200`}
      >
        {customStringify(result)}
      </code>
    </>
  )
}

const customStringify = (value: unknown) => {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

const printResult = (result: EvalResult) => {
  if (result.success) {
    return printSuccessResult(result.value)
  }

  return printError(result.error)
}
