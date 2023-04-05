'use client'

import { CodeRunner } from '@/components/Playground'
import { useState } from 'react'

export default function Content() {
  const [shareRefresh, setShareRefresh] = useState(0)
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 inline-flex items-end w-max self-end"
        onClick={() => setShareRefresh((prev) => prev + 1)}
      >
        Share
        <svg
          className="w-5 h-5 ml-2"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
      </button>

      <div className="rounded-xl bg-white dark:bg-gray-900">
        <CodeRunner shareRefresh={shareRefresh} />
      </div>
    </div>
  )
}
