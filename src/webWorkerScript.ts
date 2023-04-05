export const workerScript = `
const safeObjects = {{safe-objects}}

const _Error = Error // in case we are accessing Error, and Error is blocked
function secure(item, prop) {
  if (safeObjects.indexOf(prop) < 0) {
    const descriptor = Object.getOwnPropertyDescriptor(item, prop)

    if (descriptor && descriptor.configurable) {
      Object.defineProperty(item, prop, {
        get: () => {
          throw new _Error('Security Exception: cannot access: ' + prop)
        },
        configurable: false,
      })
    } else {
      if (typeof item.prop === 'function') {
        item.prop = () => {
          throw new _Error('Security Exception: cannot access: ' + prop)
        }
      } else {
        delete item.prop
      }
    }
  }
}
;[self].forEach((item) => {
  while (item) {
    Object.getOwnPropertyNames(item).forEach((prop) => {
      secure(item, prop)
    })
    item = Object.getPrototypeOf(item)
  }
})

addEventListener('message', async (e) => {
  const { arg, codeUrl, callTarget } = e.data
  try {
    // @ts-expect-error prevent user code from accessing globalThis
    globalThis = {}

    const ns = await import(codeUrl)
    const value = ns[callTarget]

    if (typeof value === 'function') {
      self.postMessage({ kind: 'success', result: await value(arg) })
      return
    }

    if (safeObjects.includes('Promise') && value instanceof Promise) {
      self.postMessage({ kind: 'success', result: await value })
      return
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean' ||
      value === undefined ||
      typeof value === 'symbol' ||
      value === null ||
      typeof value === 'object'
    ) {
      self.postMessage({ kind: 'success', result: value })
      return
    }

    self.postMessage({ kind: 'error', message: 'unknown value' })
  } catch (err) {
    try {
      self.postMessage({
        kind: 'error',
        message: err instanceof Error ? err : String(err),
      })
    } catch (_) {
      // Error is not serializable on WebKit/ Safari, so error might be thrown
      self.postMessage({
        kind: 'error',
        message: String(err),
      })
    }
  }
})


`
