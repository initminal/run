import { createInitminalRun, InitminalRun } from '../src'
import { minSafeObjects } from '../src/config'

const dependecies = {
  lodash: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm',
  'bignumber.js': 'https://cdn.jsdelivr.net/npm/bignumber.js@9.1.1/+esm',
  mustache: 'https://cdn.jsdelivr.net/npm/mustache@4.2.0/+esm',
}

/**
 * @description This function delays triggering an async function.
 * @param {Function} fn - The async function to execute after the delay.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise} A promise that resolves to the async function's promise after the delay.
 */
const delayTask = async (fn: () => Promise<unknown>, ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(fn()), ms))

const mockAsyncFn = (value: unknown, ms: number) =>
  `export const initminal = () => new Promise((resolve) => {
  setTimeout(() => resolve(${value}), ${ms})
});`

describe('integration test', () => {
  let InitminalRun: InitminalRun

  beforeEach(() => {
    InitminalRun = createInitminalRun()
  })

  afterEach(() => {
    InitminalRun.terminate()
  })

  it('should return value', async () => {
    InitminalRun = createInitminalRun({
      whitelists: [...minSafeObjects],
      encodeStrategy: 'UTF-8',
    })
    {
      const result = await InitminalRun.run(
        "export const initminal = 'hello world'"
      )
      expect(result).toMatchObject({ success: true, value: 'hello world' })
    }
    {
      const result = await InitminalRun.run('export const initminal = B')
      expect(result).toMatchObject({ success: false })
    }
  })

  it('should return resolved promise', async () => {
    InitminalRun = createInitminalRun({
      whitelists: [...minSafeObjects, 'Promise'],
    })
    const result = await InitminalRun.run(
      'export const initminal = Promise.resolve(4)'
    )
    expect(result).toMatchObject({ success: true, value: 4 })
  })

  it('should execute function', async () => {
    {
      const result = await InitminalRun.run(
        'export const initminal = (num) => 5 ** num',
        undefined,
        5
      )
      expect(result).toMatchObject({ success: true, value: 3125 })
    }
    {
      const result = await InitminalRun.run(
        'export const initminal = (obj) => Object.keys(obj)',
        undefined,
        { a: 1, b: 2 }
      )
      expect(result).toMatchObject({ success: true, value: ['a', 'b'] })
    }
  })

  it('should import module', async () => {
    const result = await InitminalRun.run(
      `
        import BigNumber from 'bignumber.js'
        const a = new BigNumber('123456.7e-3')
        export const initminal = a.toString()
      `,
      dependecies
    )
    expect(result).toMatchObject({ success: true, value: '123.4567' })
  })

  it('should fail if no relevant dependency supplied for a module', async () => {
    const result = await InitminalRun.run(`
        import _ from 'lodash';
        export const a = _.chunk(['a', 'b', 'c', 'd'], 2);
        export const initminal = a;
      `)
    expect(result).toEqual({
      success: false,
      error: {
        kind: 'error-eval-get-dependencies',
        error: 'No URL found for lodash',
      },
    })
  })

  it('should be able to run same code twice', async () => {
    {
      const result = await InitminalRun.run(
        `
        import _ from 'lodash';
        export const initminal = _.chunk(['a', 'b', 'c', 'd'], 2);
      `,
        dependecies
      )
      expect(result).toEqual({
        success: true,
        value: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      })
    }
    {
      const result = await InitminalRun.run(
        `
        import _ from 'lodash';
        export const initminal = B;
      `,
        dependecies
      )
      expect(result).toMatchObject({
        success: false,
      })
    }
  })

  it('should load module from http URL', async () => {
    const result = await InitminalRun.run(
      `
        import _ from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm';
        export const initminal = _.chunk(['a', 'b', 'c', 'd'], 2);
      `,
      dependecies
    )
    expect(result).toEqual({
      success: true,
      value: [
        ['a', 'b'],
        ['c', 'd'],
      ],
    })
  })

  it('should enqueue tasks, and run them one by one', async () => {
    const result = await Promise.all([
      delayTask(() => InitminalRun.run(mockAsyncFn(1, 2000), dependecies), 0),
      delayTask(() => InitminalRun.run(mockAsyncFn(2, 1000), dependecies), 700),
      delayTask(() => InitminalRun.run(mockAsyncFn(3, 100), dependecies), 700),
      delayTask(() => InitminalRun.run(mockAsyncFn(4, 1200), dependecies), 700),
      delayTask(() => InitminalRun.run(mockAsyncFn(5, 400), dependecies), 680),
    ])
    expect(result[0]).toEqual({
      success: true,
      value: 1,
    })
    expect(result[1]).toEqual({
      success: true,
      value: 2,
    })
    expect(result[2]).toEqual({
      success: true,
      value: 3,
    })
    expect(result[3]).toEqual({
      success: true,
      value: 4,
    })
    expect(result[4]).toEqual({
      success: true,
      value: 5,
    })
  })

  it('should use the correct library even if the package name is conflicted, see `same-name`', async () => {
    const result = await Promise.all([
      delayTask(
        () =>
          InitminalRun.run(
            `
              import _ from 'same-name';
              export const initminal = _.chunk(['a', 'b', 'c', 'd'], 2);
            `,
            {
              'same-name': 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm',
            }
          ),
        0
      ),
      delayTask(
        () =>
          InitminalRun.run(
            `
              import BigNumber from 'same-name'
              const a = new BigNumber('123456.7e-3')
              export const initminal = a.toString()
           `,
            {
              'same-name':
                'https://cdn.jsdelivr.net/npm/bignumber.js@9.1.1/+esm',
            }
          ),
        300
      ),
      delayTask(
        () =>
          InitminalRun.run(
            `
              import _ from 'same-name';
              export const initminal = _.chunk(['a', 'b', 'c', 'd'], 2);
            `,
            {
              'same-name': 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm',
            }
          ),
        0
      ),
    ])
    expect(result[0]).toEqual({
      success: true,
      value: [
        ['a', 'b'],
        ['c', 'd'],
      ],
    })
    expect(result[1]).toEqual({
      success: true,
      value: '123.4567',
    })
    expect(result[2]).toEqual({
      success: true,
      value: [
        ['a', 'b'],
        ['c', 'd'],
      ],
    })
  })
})
