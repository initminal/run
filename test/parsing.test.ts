import {
  findMatchingModuleNames,
  transformHttpUrlForNodeJsCompatability,
} from '../src/utils'

describe('parsing import syntax with RegExp', () => {
  it('works well with typical use cases', () => {
    const matchedModuleNames = findMatchingModuleNames(`
import { abc } from "module1";
import * as def from 'module2';
 import * as def from 'module3';
   ;  import * as def from 'module4';
   ;;;  import * as def from 'module5';   
import { jkl } from 'data:text/javascript;charset=utf-8,somestring'
import { add, multiply } from "./arithmetic.ts";
import {
  add,
  multiply,
} from "https://x.nest.land/ramda@0.27.0/source/index.js";
import { 
    add,
    multiply
} from 'module6';
console.log('import * from "xyz"')

const fn = () => "import * from 'xyz'"
const fn = () => "   import * from 'xyz'   "

`)
    expect(matchedModuleNames).toMatchObject([
      'module1',
      'module2',
      'module3',
      'module4',
      'module5',
      'module6',
    ])
  })

  it('regexp strategy does not plays well with these cases', () => {
    const matchedModuleNames = findMatchingModuleNames(`
;;;  import * as def from 'module1';       ;;;  import * as def from 'ignored-module';
import from 'wrong-module-bad-syntax'
import { abc } from "bad-syntax-single-and-double-quote'
`)
    expect(matchedModuleNames).toMatchObject([
      'module1',
      'wrong-module-bad-syntax',
      'bad-syntax-single-and-double-quote',
    ])
  })
})

describe('parse http URL for node.js compatability', () => {
  it('should parse http protocol', async () => {
    expect(
      await transformHttpUrlForNodeJsCompatability(
        `import { abc } from "http://example.com";`
      )
    ).toEqual(
      'import { abc } from "data:text/javascript;charset=utf-8,%3C!doctype%20html%3E%0A%3Chtml%3E%0A%3Chead%3E%0A%20%20%20%20%3Ctitle%3EExample%20Domain%3C%2Ftitle%3E%0A%0A%20%20%20%20%3Cmeta%20charset%3D%22utf-8%22%20%2F%3E%0A%20%20%20%20%3Cmeta%20http-equiv%3D%22Content-type%22%20content%3D%22text%2Fhtml%3B%20charset%3Dutf-8%22%20%2F%3E%0A%20%20%20%20%3Cmeta%20name%3D%22viewport%22%20content%3D%22width%3Ddevice-width%2C%20initial-scale%3D1%22%20%2F%3E%0A%20%20%20%20%3Cstyle%20type%3D%22text%2Fcss%22%3E%0A%20%20%20%20body%20%7B%0A%20%20%20%20%20%20%20%20background-color%3A%20%23f0f0f2%3B%0A%20%20%20%20%20%20%20%20margin%3A%200%3B%0A%20%20%20%20%20%20%20%20padding%3A%200%3B%0A%20%20%20%20%20%20%20%20font-family%3A%20-apple-system%2C%20system-ui%2C%20BlinkMacSystemFont%2C%20%22Segoe%20UI%22%2C%20%22Open%20Sans%22%2C%20%22Helvetica%20Neue%22%2C%20Helvetica%2C%20Arial%2C%20sans-serif%3B%0A%20%20%20%20%20%20%20%20%0A%20%20%20%20%7D%0A%20%20%20%20div%20%7B%0A%20%20%20%20%20%20%20%20width%3A%20600px%3B%0A%20%20%20%20%20%20%20%20margin%3A%205em%20auto%3B%0A%20%20%20%20%20%20%20%20padding%3A%202em%3B%0A%20%20%20%20%20%20%20%20background-color%3A%20%23fdfdff%3B%0A%20%20%20%20%20%20%20%20border-radius%3A%200.5em%3B%0A%20%20%20%20%20%20%20%20box-shadow%3A%202px%203px%207px%202px%20rgba(0%2C0%2C0%2C0.02)%3B%0A%20%20%20%20%7D%0A%20%20%20%20a%3Alink%2C%20a%3Avisited%20%7B%0A%20%20%20%20%20%20%20%20color%3A%20%2338488f%3B%0A%20%20%20%20%20%20%20%20text-decoration%3A%20none%3B%0A%20%20%20%20%7D%0A%20%20%20%20%40media%20(max-width%3A%20700px)%20%7B%0A%20%20%20%20%20%20%20%20div%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20margin%3A%200%20auto%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20width%3A%20auto%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20%3C%2Fstyle%3E%20%20%20%20%0A%3C%2Fhead%3E%0A%0A%3Cbody%3E%0A%3Cdiv%3E%0A%20%20%20%20%3Ch1%3EExample%20Domain%3C%2Fh1%3E%0A%20%20%20%20%3Cp%3EThis%20domain%20is%20for%20use%20in%20illustrative%20examples%20in%20documents.%20You%20may%20use%20this%0A%20%20%20%20domain%20in%20literature%20without%20prior%20coordination%20or%20asking%20for%20permission.%3C%2Fp%3E%0A%20%20%20%20%3Cp%3E%3Ca%20href%3D%22https%3A%2F%2Fwww.iana.org%2Fdomains%2Fexample%22%3EMore%20information...%3C%2Fa%3E%3C%2Fp%3E%0A%3C%2Fdiv%3E%0A%3C%2Fbody%3E%0A%3C%2Fhtml%3E%0A";'
    )
  })
})
