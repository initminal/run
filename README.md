# @initminal/run

Safely execute untrusted code with ESM syntax support, dynamic injection of ESM modules from URL or plain JS code, and granular access control based on whitelisting for each JS object.

## Features

- **ESM syntax**: untrusted code can use `import` and `export` module syntax
- **Dynamic ESM module injection**: easily inject modules dependencies from `data:` or `http(s)` `URL`s, or just plain JS code string
- **Granular access control**: untrusted code has access only to whitelisted JS objects
- **Isomorphic**: compatible with both browsers and Node.js
- **Queue**: evaluations are automatically queued
- **Fast**: leverage native `import()` syntax for code evaluation
- **Non-blocking**: run code inside a module worker, off the main thread
- **Always terminable**: terminate long running code at any time

## Get Started

To install:

```sh
npm i --save @initminal/run
```

## Usage

Create an evaluator and execute JS code:

```ts
const InitminalRun = createInitminalRun()
const result = await InitminalRun.run("export const initminal = 'hello world'")
console.log(result)
// hello world
```

## Demo

Try it out in the [playground](https://initminal.com/run/playground)

## Documentation

Check out the [documentation](https://initminal.com/run/docs).

## 📢 Notice

- 🎉 Firefox support: 
  - Previous Firefox versions lacked the implementation of dynamic `import()` in workers, which this library requires. 
  - However, the [Implement Dynamic import for workers](https://bugzilla.mozilla.org/show_bug.cgi?id=1540913) fix has been completed and is scheduled for release in version 113.
- 🧪 Experimental status: this project is still considered unstable and breaking changes may occur (but only when unavoidable).

## 🔒 Security

- The security of code evaluation using this library depends on the set of whitelisted JS objects.
- The default list of accessible JS objects (subject to updates) should be considered safe for untrusted code.
- IO objects such as `fetch` or `indexedDB` are NOT whitelisted by default. Untrusted code can access to host's data if they are manually whitelisted.
- If you must use one or more I/O objects, consider combining another strategy, e.g. executing in an `iframe` sandbox.
- in the future, proxy support for I/O actions might be implemented as a feature to enable safe I/O operations from untrusted code (contributions are welcome!).

## 📝Todos:

- [ ] Proxies for objects (e.g. `fetch`), to enable secure I/O operations.
- [ ] Typescript support
- [ ] Worker pool
- [ ] Support other evaluation strategies, such as using WASM, other programming languages
- [ ] ...feel free to suggests any new ideas!

Contributions are welcome!

## Acknowledgement

- the approach of whitelisting JS objects in a web worker of executing untrusted code takes notes from the blog post [Executing untrusted JavaScript code in a browser](https://www.meziantou.net/executing-untrusted-javascript-code-in-a-browser.htm) by [Avatar
  Gérald Barré](https://github.com/meziantou)
- using `import()` as an alternative to `eval()` to execute JS code takes notes from the blog post [Evaluating JavaScript code via import()](https://2ality.com/2019/10/eval-via-import.html) by [Dr. Axel Rauschmayer](https://github.com/rauschma)
