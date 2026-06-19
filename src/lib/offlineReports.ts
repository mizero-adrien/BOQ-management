import { openDB, type DBSchema } from 'idb'

export interface PendingReport {
  id: string
  savedAt: string
  reportDate: string
  projectId: string
  projectName: string
  pmId: string
  userId: string
  engineerName: string
  zoneId: string | null
  workersCount: number
  progressPct: number
  weather: string | null
  notes: string
  issues: string
  photos: { name: string; type: string; data: ArrayBuffer }[]
}

interface OfflineDB extends DBSchema {
  'pending-reports': {
    key: string
    value: PendingReport
  }
}

function getDB() {
  return openDB<OfflineDB>('boq-offline', 1, {
    upgrade(db) {
      db.createObjectStore('pending-reports', { keyPath: 'id' })
    },
  })
}

export async function saveOfflineReport(report: PendingReport): Promise<void> {
  const db = await getDB()
  await db.put('pending-reports', report)
}

export async function getOfflineReports(): Promise<PendingReport[]> {
  const db = await getDB()
  return db.getAll('pending-reports')
}

export async function deleteOfflineReport(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('pending-reports', id)
}

export async function countOfflineReports(): Promise<number> {
  const db = await getDB()
  return db.count('pending-reports')
}
