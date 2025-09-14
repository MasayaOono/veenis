export type TocItem = { id: string; text: string; level: 1 | 2 }


export function buildToc(md: string): TocItem[] {
const lines = md.split(/\r?\n/)
const items: TocItem[] = []
for (const line of lines) {
const h1 = /^#\s+(.+)$/.exec(line)
if (h1) { items.push({ id: toId(h1[1].trim()), text: h1[1].trim(), level: 1 }); continue }
const h2 = /^##\s+(.+)$/.exec(line)
if (h2) { items.push({ id: toId(h2[1].trim()), text: h2[1].trim(), level: 2 }); continue }
}
return items
}


export function toId(text: string): string {
return text
.toLowerCase()
.replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\s-]/g, '')
.trim()
.replace(/\s+/g, '-')
}