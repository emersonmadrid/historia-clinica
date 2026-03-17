'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/useToast'
import { Plus, Trash2, FileText, FileImage, Download, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PatientDoc {
  id: string
  name: string
  description: string | null
  fileUrl: string
  fileSize: number
  mimeType: string
  createdAt: string
  uploadedBy: { id: string; name: string }
}

interface DocumentManagerProps {
  patientId: string
  documents: PatientDoc[]
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className="h-5 w-5 text-primary" />
  }
  return <FileText className="h-5 w-5 text-foreground-muted" />
}

export function DocumentManager({ patientId, documents }: DocumentManagerProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [dragOver, setDragOver] = useState(false)

  function handleFileSelect(file: File) {
    setSelectedFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
      setOpen(true)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (description) formData.append('description', description)

      const res = await fetch(`/api/pacientes/${patientId}/documentos`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        toast({ title: 'Documento subido correctamente' })
        setOpen(false)
        setSelectedFile(null)
        setDescription('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        router.refresh()
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Error al subir el archivo', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al subir el archivo', variant: 'error' })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('¿Eliminar este documento?')) return
    setDeleting(docId)
    try {
      const res = await fetch(`/api/pacientes/${patientId}/documentos/${docId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast({ title: 'Documento eliminado' })
        router.refresh()
      } else {
        toast({ title: 'Error al eliminar', variant: 'error' })
      }
    } catch {
      toast({ title: 'Error al eliminar', variant: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Subir documento
        </Button>
      </div>

      {/* Drop zone when no documents */}
      {documents.length === 0 ? (
        <div
          className={`border-2 border-dashed p-10 text-center transition-colors ${
            dragOver ? 'border-primary bg-sky-50' : 'border-border'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-8 w-8 text-border mb-3" />
          <p className="text-sm text-foreground-subtle">No hay documentos. Arrastra un archivo aquí o</p>
          <button
            className="mt-2 text-sm text-primary hover:underline"
            onClick={() => setOpen(true)}
          >
            selecciona un archivo
          </button>
        </div>
      ) : (
        <div
          className={`space-y-2 transition-colors ${dragOver ? 'opacity-60' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 border border-border-subtle p-4 hover:bg-background"
            >
              <FileIcon mimeType={doc.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-foreground-muted">
                  {formatBytes(doc.fileSize)} &bull; {formatDate(doc.createdAt)} &bull; {doc.uploadedBy.name}
                </p>
                {doc.description && (
                  <p className="text-xs text-foreground-subtle mt-0.5 truncate">{doc.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" asChild title="Descargar">
                  <a href={doc.fileUrl} download={doc.name} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 text-foreground-muted" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedFile(null); setDescription('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
            <DialogDescription>Máximo 10 MB</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-file">Archivo</Label>
              <Input
                id="doc-file"
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt"
                required={!selectedFile}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-xs text-foreground-muted">
                  Seleccionado: {selectedFile.name} ({formatBytes(selectedFile.size)})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-description">Descripción (opcional)</Label>
              <Textarea
                id="doc-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Resultado de análisis de sangre, Enero 2025"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading || !selectedFile}>
                {uploading ? 'Subiendo...' : 'Subir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
