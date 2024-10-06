export const appDir = (() => {
  const basePath = new URL('..', import.meta.url).href
    .replace(/^file:\/*/, '')
    .replace(/\/$/, '')
    .replace('/app.asar', '')

  return () => basePath
})()
