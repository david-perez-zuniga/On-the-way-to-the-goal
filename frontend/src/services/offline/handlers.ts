type MockHandler = (
  body: unknown,
  headers: Record<string, string>,
  params: Record<string, string>,
) => unknown

interface PatternEntry {
  method: string
  pattern: RegExp
  paramNames: string[]
  handler: MockHandler
}

const entries: PatternEntry[] = []

export function registerHandler(method: string, path: string, handler: MockHandler): void {
  const segments = path.split('/')
  const paramNames: string[] = []
  const regexParts = segments.map((seg) => {
    if (seg.startsWith(':')) {
      paramNames.push(seg.slice(1))
      return '([^/]+)'
    }
    return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  })
  const pattern = new RegExp(`^${regexParts.join('/')}$`)
  entries.push({ method: method.toUpperCase(), pattern, paramNames, handler })
}

export function matchHandler(
  method: string,
  path: string,
  body: unknown,
  headers: Record<string, string>,
): { data: unknown } | undefined {
  const cleanPath = path.split('?')[0]
  for (const entry of entries) {
    if (entry.method !== method.toUpperCase()) continue
    const match = cleanPath.match(entry.pattern)
    if (!match) continue
    const params: Record<string, string> = {}
    entry.paramNames.forEach((name, i) => {
      params[name] = match[i + 1]
    })
    try {
      const data = entry.handler(body, headers, params)
      return { data }
    } catch (err) {
      throw err
    }
  }
  return undefined
}
