import { CodeRunnerMinimumForFrontPage } from '@/components/Playground'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Home | Run | Initminal',
}

export default function Home() {
  return (
    <main>
      <div className="flex flex-col">
        <h1 className="text-center mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
          Initminal{' '}
          <mark className="px-2 text-white bg-blue-600 rounded dark:bg-blue-500">
            run
          </mark>{' '}
        </h1>
        <p className="text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400 px-1 pb-4">
          Safely execute untrusted code with ESM syntax support, dynamic
          injection of ESM modules from URL or plain JS code, and granular
          access control based on whitelisting for each JS object.
        </p>
        <div className=" bg-white dark:bg-gray-900 rounded-xl">
          <CodeRunnerMinimumForFrontPage />
        </div>
        <Link
          href="/playground"
          className="inline-flex items-center place-self-end text-black dark:text-white text-sm font-medium pt-4 border-b-2"
        >
          Come Try
          <svg
            className="w-3 h-3 ml-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
            ></path>
          </svg>
        </Link>

        <h3 className="text-center my-8 text-3xl font-extrabold leading-none tracking-tight text-gray-900 md:text-4xl lg:text-5xl dark:text-white">
          Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            title="ESM Syntax"
            description="untrusted code can use `import` and `export` module syntax"
          />
          <FeatureCard
            title="Dynamic ESM module injection"
            description="easily inject modules dependencies from `data:` or `http(s)` `URL`s, or just plain JS code string."
          />
          <FeatureCard
            title="Granular access control"
            description="untrusted code has access only to whitelisted JS objects"
          />
          <FeatureCard
            title="Isomorphic"
            description="compatible with both browsers and Node.js"
          />
          <FeatureCard
            title="Queue"
            description="evaluations are automatically queued"
          />
          <FeatureCard
            title="Fast"
            description="leverage native `import()` syntax for code evaluation"
          />
          <FeatureCard
            title="Non-blocking"
            description="run code inside a module worker, off the main thread"
          />
          <FeatureCard
            title="Always terminable"
            description="terminate long running code at any time"
          />
        </div>

        <h3 className="text-center my-8 text-3xl font-extrabold leading-none tracking-tight text-gray-900 md:text-4xl lg:text-5xl dark:text-white">
          See More
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <SeeMoreCard
            title="Playground"
            href="/playground"
            description="try it out"
          />
          <SeeMoreCard title="Docs" href="/docs" description="read the docs" />
          <SeeMoreCard
            title={
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gray-900 dark:text-white"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Github
              </>
            }
            href="https://github.com/initminal/run"
            description="checkout the repo"
          />
        </div>
      </div>
    </main>
  )
}

const FeatureCard = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 w-full">
    <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
      {title}
    </h5>
    <p className="font-normal text-gray-700 dark:text-gray-400">
      {description}
    </p>
  </div>
)

const SeeMoreCard = ({
  title,
  description,
  href,
}: {
  title: string | JSX.Element
  description: string
  href: string
}) => (
  <Link
    href={href}
    className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700  text-gray-900 dark:text-white flex items-center place-content-between"
  >
    <div>
      <h5 className="mb-2 text-1xl font-bold tracking-tight text-gray-900 dark:text-white inline-flex items-center gap-1">
        {title}
      </h5>
      <p className="font-normal text-gray-700 dark:text-gray-400">
        {description}
      </p>
    </div>
    <svg
      aria-hidden="true"
      className="w-4 h-4 ml-2 -mr-1"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      ></path>
    </svg>
  </Link>
)
