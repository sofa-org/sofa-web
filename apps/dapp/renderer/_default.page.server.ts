export { render }
export { prerender }

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { routes } from '../src/routes'
import { getPageSEO } from '../src/seo-config'

// Read the index.html template file from source (not dist)
// We need the original template with placeholders, not the processed one
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// In build mode, we need to go back to the source directory
// dist/server/entries/ -> ../../ (dist/) -> ../../ (apps/dapp/)
const sourceIndexHtmlPath = path.resolve(__dirname, '../../../index.html')

let indexHtmlTemplate: string

if (fs.existsSync(sourceIndexHtmlPath)) {
  // Build mode: read from source
  indexHtmlTemplate = fs.readFileSync(sourceIndexHtmlPath, 'utf-8')
} else {
  // Dev mode: read from local
  const devIndexHtmlPath = path.resolve(__dirname, '../index.html')
  if (fs.existsSync(devIndexHtmlPath)) {
    indexHtmlTemplate = fs.readFileSync(devIndexHtmlPath, 'utf-8')
  } else {
    throw new Error(`Could not find index.html at ${sourceIndexHtmlPath} or ${devIndexHtmlPath}`)
  }
}

function render(pageContext: any) {
  // Get the SEO information of the current page path
  // Extract only the pathname, remove query parameters and hash
  let pathname = pageContext.urlPathname || pageContext.urlOriginal || '/'

  // Remove query parameters (?) and hash (#) if present
  pathname = pathname.split('?')[0].split('#')[0]

  const seo = getPageSEO(pathname)

  // Replace placeholders in the template with actual SEO values
  let documentHtml = indexHtmlTemplate
    .replace('{{title}}', seo.title)
    .replace('{{description}}', seo.description)
    .replace('{{keywords}}', seo.keywords || '')

  return {
    documentHtml,
    pageContext: {
      seo
    }
  }
}

async function prerender() {
  const urls = routes
    .filter(route => route.path !== '/test')
    .map(route => route.path)  // return URL strings

  return urls
}
