// Wildcard route page — matches all paths
// The actual page content is handled by React Router on the client

export { Page }

function Page() {
  // This component exists only to satisfy vite-plugin-ssr's requirement
  // The actual page rendering is handled entirely by client-side React Router
  // During pre-rendering this component is not actually rendered; it only provides route matching
  return null
}