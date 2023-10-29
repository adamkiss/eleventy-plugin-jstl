import xhtm from './src/xhtm.mjs'
import vhtml from './src/vhtml.mjs'

// import xhtm from 'xhtm'
// import vhtml from '@small-tech/hyperscript-to-html-string'

const html = xhtm.bind(vhtml)

console.log(await html`<h1>hello</h1>`)
