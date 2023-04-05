import _ from 'lodash'
import fetch from 'node-fetch'
import { Dependencies } from './evaluator'
import { EncodeType } from './types'

const exhaustiveCheck = (bottom: never) => {
  throw new Error('Unhandled situation: ' + String(bottom))
}

const isValidUrl = (str: string): boolean => {
  try {
    return !!new URL(str)
  } catch (e) {
    return false
  }
}

// regular expression to (only partially) match the ESM `import` syntax
const re =
  /(^[\s|;]*\bimport\b[^;'":@]+?\bfrom\s)[\\"|\\']((@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)[\\"|\\']/gms

export const findMatchingModuleNames = (str: string): string[] => {
  const matches = str.matchAll(re)
  return Array.from(matches, ([, , name]) => name)
}

type URLString = string
export const encode = (str: string, kind: EncodeType): URLString => {
  if (kind === 'Blob')
    return URL.createObjectURL(new Blob([str], { type: 'text/javascript' }))
  if (kind === 'UTF-8')
    return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(str)
  return exhaustiveCheck(kind)
}

export const transformModuleNameToUrls = (
  deps: Dependencies,
  str: string,
  encodeStrategy: EncodeType
) =>
  str.replaceAll(re, (_, import_x_from, name) => {
    const urlStr = isValidUrl(deps[name])
      ? deps[name]
      : encode(deps[name], encodeStrategy)
    return `${import_x_from}"${urlStr}"`
  })

/**
 * This RegExp attempts to match http(s):// imports URLs to be compatible for Node.js
 */
const reHttp =
  /(^[\s|;]*\bimport\b[^;'":@]+?\bfrom\s)[\\"|\\'](https?:\/\/.*?)[\\"|\\']/gms

export const transformHttpUrlForNodeJsCompatability = async (str: string) => {
  const matches = Array.from(str.matchAll(reHttp), ([, , url]) => url)
  const fetchResult = await Promise.all(
    matches.map(async (url) => await (await fetch(url)).text())
  )

  const deps = _.keyBy(
    _.zipWith(matches, fetchResult, (url, code) => ({
      url,
      code,
    })),
    'url'
  )

  return str.replaceAll(reHttp, (_, import_x_from, url) => {
    return `${import_x_from}"${encode(deps[url].code, 'UTF-8')}"`
  })
}
