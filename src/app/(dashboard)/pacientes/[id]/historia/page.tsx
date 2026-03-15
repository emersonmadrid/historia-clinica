import { redirect } from 'next/navigation'

export default async function HistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/pacientes/${id}?tab=consultas`)
}
