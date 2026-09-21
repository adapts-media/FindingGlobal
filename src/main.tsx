import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import '@fontsource-variable/manrope'
import './styles.css'

const router = createRouter({
  routeTree,
  trailingSlash: 'always',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Prerendered pages (see scripts/prerender.js) ship with their head tags already baked in, for
// crawlers and no-JS clients. This app mounts with createRoot (not hydrateRoot), and React
// only dedupes title/meta tags that *it* rendered — so without this, <HeadContent /> adds a
// second <title>/description/canonical alongside the baked-in one, and document.title keeps
// returning the first (stale) one. Clearing them here makes React's tags the only ones in the
// live DOM. The og:site_name/og:type/twitter:card tags from index.html aren't route-specific,
// so they're left alone.
document
  .querySelectorAll(
    'head title, head meta[name="description"], head meta[name="robots"], head link[rel="canonical"], ' +
      'head meta[property="og:title"], head meta[property="og:description"], head meta[property="og:image"]'
  )
  .forEach((el) => el.remove())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
