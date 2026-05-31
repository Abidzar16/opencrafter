import db from '@/lib/db/db'

const ALL_TABLES = [
  'novels',
  'series',
  'acts',
  'chapters',
  'scenes',
  'scene_content',
  'codex_entries',
  'codex_relations',
  'codex_progressions',
  'snippets',
  'chat_threads',
  'chat_messages',
  'prompts',
  'prompt_components',
  'prompt_personas',
  'prompt_presets',
  'model_configs',
  'api_keys',
  'revisions',
  'labels',
] as const

type TableName = (typeof ALL_TABLES)[number]
type BackupData = Record<TableName, unknown[]>

export interface BackupFile {
  version: 1
  exportedAt: string
  data: BackupData
}

export async function exportAllData(): Promise<BackupFile> {
  const data = {} as BackupData
  for (const table of ALL_TABLES) {
    data[table] = await (db[table] as ReturnType<typeof db.table>).toArray()
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function downloadBackup(backup: BackupFile): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `opencrafter-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportAndDownload(): Promise<void> {
  const backup = await exportAllData()
  downloadBackup(backup)
}
