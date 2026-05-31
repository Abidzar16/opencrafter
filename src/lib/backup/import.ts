import db from '@/lib/db/db'
import type { BackupFile } from './export'

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

export function parseBackupFile(json: string): BackupFile {
  const parsed = JSON.parse(json) as unknown
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { version?: unknown }).version !== 1
  ) {
    throw new Error('Invalid backup file: missing version field.')
  }
  return parsed as BackupFile
}

export async function importAllData(backup: BackupFile): Promise<void> {
  await db.transaction(
    'rw',
    ALL_TABLES.map(t => db[t as TableName] as ReturnType<typeof db.table>),
    async () => {
      for (const table of ALL_TABLES) {
        const t = db[table as TableName] as ReturnType<typeof db.table>
        await t.clear()
        const rows = backup.data[table as TableName]
        if (Array.isArray(rows) && rows.length > 0) {
          await t.bulkAdd(rows)
        }
      }
    },
  )
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}
