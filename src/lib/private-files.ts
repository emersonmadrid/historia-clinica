import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const PRIVATE_UPLOADS_DIR = join(process.cwd(), 'private_uploads')

export function getPrivatePatientDir(patientId: string) {
  return join(PRIVATE_UPLOADS_DIR, patientId)
}

export function getPrivatePatientFilePath(patientId: string, fileName: string) {
  return join(getPrivatePatientDir(patientId), fileName)
}

export async function savePrivatePatientFile(patientId: string, fileName: string, buffer: Buffer) {
  const dir = getPrivatePatientDir(patientId)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  const path = getPrivatePatientFilePath(patientId, fileName)
  await writeFile(path, buffer)
  return path
}

export async function readPrivatePatientFile(patientId: string, fileName: string) {
  return readFile(getPrivatePatientFilePath(patientId, fileName))
}

export async function deletePrivatePatientFile(patientId: string, fileName: string) {
  const path = getPrivatePatientFilePath(patientId, fileName)
  if (existsSync(path)) {
    await unlink(path)
  }
}
