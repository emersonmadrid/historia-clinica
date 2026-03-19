'use client'

import { useState } from 'react'
import { Calculator, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Framingham ATP-III 2001 ────────────────────────────────────────────────

function getAgeGroupIdx(age: number) {
  if (age < 40) return 0
  if (age < 50) return 1
  if (age < 60) return 2
  if (age < 70) return 3
  return 4
}

function getCholIdx(chol: number) {
  if (chol < 160) return 0
  if (chol < 200) return 1
  if (chol < 240) return 2
  if (chol < 280) return 3
  return 4
}

function getMaleAgePoints(age: number) {
  if (age < 35) return -9
  if (age < 40) return -4
  if (age < 45) return 0
  if (age < 50) return 3
  if (age < 55) return 6
  if (age < 60) return 8
  if (age < 65) return 10
  if (age < 70) return 11
  if (age < 75) return 12
  return 13
}

function getFemaleAgePoints(age: number) {
  if (age < 35) return -7
  if (age < 40) return -3
  if (age < 45) return 0
  if (age < 50) return 3
  if (age < 55) return 6
  if (age < 60) return 8
  if (age < 65) return 10
  if (age < 70) return 12
  if (age < 75) return 14
  return 16
}

const MALE_CHOL_POINTS = [
  [0, 4, 7, 9, 11],
  [0, 3, 5, 6, 8],
  [0, 2, 3, 4, 5],
  [0, 1, 1, 2, 3],
  [0, 0, 0, 1, 1],
]
const FEMALE_CHOL_POINTS = [
  [0, 4, 8, 11, 13],
  [0, 3, 6, 8, 10],
  [0, 2, 4, 5, 7],
  [0, 1, 2, 3, 4],
  [0, 1, 1, 2, 2],
]
const MALE_SMOKER_POINTS = [8, 5, 3, 1, 1]
const FEMALE_SMOKER_POINTS = [9, 7, 4, 2, 1]

function getHDLPoints(hdl: number) {
  if (hdl >= 60) return -1
  if (hdl >= 50) return 0
  if (hdl >= 40) return 1
  return 2
}

function getMaleSBPPoints(sbp: number, meds: boolean) {
  if (sbp < 120) return 0
  if (sbp < 130) return meds ? 1 : 0
  if (sbp < 140) return meds ? 2 : 1
  if (sbp < 160) return meds ? 2 : 1
  return meds ? 3 : 2
}

function getFemaleSBPPoints(sbp: number, meds: boolean) {
  if (sbp < 120) return 0
  if (sbp < 130) return meds ? 3 : 1
  if (sbp < 140) return meds ? 4 : 2
  if (sbp < 160) return meds ? 5 : 3
  return meds ? 6 : 4
}

const MALE_RISK: Record<number, number> = {
  0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3,
  8: 4, 9: 5, 10: 6, 11: 8, 12: 10, 13: 12, 14: 16, 15: 20, 16: 25,
}
const FEMALE_RISK: Record<number, number> = {
  9: 1, 10: 1, 11: 1, 12: 1, 13: 2, 14: 2, 15: 3, 16: 4,
  17: 5, 18: 6, 19: 8, 20: 11, 21: 14, 22: 17, 23: 22, 24: 27,
}

function framinghamRisk(p: {
  sex: 'male' | 'female'
  age: number
  totalChol: number
  hdl: number
  sbp: number
  onBPMeds: boolean
  smoker: boolean
}): { points: number; risk10y: number; category: string; color: string } {
  const ag = getAgeGroupIdx(p.age)
  const ci = getCholIdx(p.totalChol)
  let pts: number

  if (p.sex === 'male') {
    pts = getMaleAgePoints(p.age)
    pts += MALE_CHOL_POINTS[ag][ci]
    pts += getHDLPoints(p.hdl)
    pts += getMaleSBPPoints(p.sbp, p.onBPMeds)
    if (p.smoker) pts += MALE_SMOKER_POINTS[ag]
  } else {
    pts = getFemaleAgePoints(p.age)
    pts += FEMALE_CHOL_POINTS[ag][ci]
    pts += getHDLPoints(p.hdl)
    pts += getFemaleSBPPoints(p.sbp, p.onBPMeds)
    if (p.smoker) pts += FEMALE_SMOKER_POINTS[ag]
  }

  let risk: number
  if (p.sex === 'male') {
    if (pts <= -1) risk = 1
    else if (pts >= 17) risk = 30
    else risk = MALE_RISK[pts] ?? 1
  } else {
    if (pts <= 8) risk = 1
    else if (pts >= 25) risk = 30
    else risk = FEMALE_RISK[pts] ?? 1
  }

  const category = risk < 10 ? 'Bajo (<10%)' : risk < 20 ? 'Moderado (10-20%)' : 'Alto (>20%)'
  const color = risk < 10 ? 'text-success' : risk < 20 ? 'text-warning' : 'text-danger'
  return { points: pts, risk10y: risk, category, color }
}

// ─── eGFR CKD-EPI 2021 ──────────────────────────────────────────────────────

function calcEGFR(age: number, sex: 'male' | 'female', scr: number): number {
  const k = sex === 'female' ? 0.7 : 0.9
  const alpha = sex === 'female' ? -0.241 : -0.302
  const ratio = scr / k
  let egfr = 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, age)
  if (sex === 'female') egfr *= 1.012
  return Math.round(egfr)
}

function ckdStage(egfr: number): string {
  if (egfr >= 90) return 'G1 — Normal o alta'
  if (egfr >= 60) return 'G2 — Levemente disminuida'
  if (egfr >= 45) return 'G3a — Leve-moderada'
  if (egfr >= 30) return 'G3b — Moderada-severa'
  if (egfr >= 15) return 'G4 — Severa'
  return 'G5 — Fallo renal'
}

// ─── Cockcroft-Gault ─────────────────────────────────────────────────────────

function calcCrCl(age: number, sex: 'male' | 'female', weightKg: number, scr: number): number {
  let crcl = ((140 - age) * weightKg) / (72 * scr)
  if (sex === 'female') crcl *= 0.85
  return Math.round(crcl)
}

// ─── BMI ──────────────────────────────────────────────────────────────────────

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-warning' }
  if (bmi < 25) return { label: 'Normal', color: 'text-success' }
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-warning' }
  if (bmi < 35) return { label: 'Obesidad I', color: 'text-danger' }
  if (bmi < 40) return { label: 'Obesidad II', color: 'text-danger' }
  return { label: 'Obesidad III', color: 'text-danger' }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  age: number
  sex: 'MALE' | 'FEMALE' | 'OTHER'
  weightKg?: number | null
  heightCm?: number | null
  sbp?: number | null
  dbp?: number | null
  rr?: number | null
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  )
}

function ResultBox({ label, value, sub, color = '' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border border-border bg-surface-alt px-4 py-3 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color || 'text-foreground'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-foreground-muted">{sub}</p>}
    </div>
  )
}

function SexToggle({ value, onChange }: { value: 'male' | 'female'; onChange: (v: 'male' | 'female') => void }) {
  return (
    <div className="flex overflow-hidden border border-border">
      {(['male', 'female'] as const).map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            value === s ? 'bg-primary text-white' : 'bg-surface text-foreground-muted hover:bg-surface-alt'
          }`}
        >
          {s === 'male' ? 'Hombre' : 'Mujer'}
        </button>
      ))}
    </div>
  )
}

export function ClinicalCalculatorsButton({ age, sex, weightKg, heightCm, sbp, dbp, rr }: Props) {
  const defaultSex = sex === 'FEMALE' ? 'female' : 'male'

  // BMI
  const [bmiH, setBmiH] = useState(heightCm?.toString() ?? '')
  const [bmiW, setBmiW] = useState(weightKg?.toString() ?? '')

  // Framingham
  const [fcSex, setFcSex] = useState<'male' | 'female'>(defaultSex)
  const [fcAge, setFcAge] = useState(age.toString())
  const [totalChol, setTotalChol] = useState('')
  const [hdl, setHdl] = useState('')
  const [fcSbp, setFcSbp] = useState(sbp?.toString() ?? '')
  const [onBPMeds, setOnBPMeds] = useState(false)
  const [smoker, setSmoker] = useState(false)

  // Renal
  const [renSex, setRenSex] = useState<'male' | 'female'>(defaultSex)
  const [renAge, setRenAge] = useState(age.toString())
  const [creat, setCreat] = useState('')
  const [renW, setRenW] = useState(weightKg?.toString() ?? '')

  // CURB-65
  const [confusion, setConfusion] = useState(false)
  const [highBUN, setHighBUN] = useState(false)
  const [highRR, setHighRR] = useState(!!(rr && rr >= 30))
  const [lowBP, setLowBP] = useState(!!(sbp && sbp < 90) || !!(dbp && dbp <= 60))
  const age65 = age >= 65

  // ── Computed ──────────────────────────────────────────────────────

  const bmiResult = (() => {
    const h = parseFloat(bmiH)
    const w = parseFloat(bmiW)
    if (!h || !w || h <= 0 || w <= 0) return null
    const bmi = w / Math.pow(h / 100, 2)
    return { bmi: Math.round(bmi * 10) / 10, ...bmiCategory(bmi) }
  })()

  const framResult = (() => {
    const a = parseFloat(fcAge)
    const tc = parseFloat(totalChol)
    const h = parseFloat(hdl)
    const s = parseFloat(fcSbp)
    if (!a || !tc || !h || !s) return null
    return framinghamRisk({ sex: fcSex, age: a, totalChol: tc, hdl: h, sbp: s, onBPMeds, smoker })
  })()

  const renalResult = (() => {
    const a = parseFloat(renAge)
    const sc = parseFloat(creat)
    const w = parseFloat(renW)
    if (!a || !sc || sc <= 0) return null
    const egfr = calcEGFR(a, renSex, sc)
    const crcl = w > 0 ? calcCrCl(a, renSex, w, sc) : null
    return { egfr, stage: ckdStage(egfr), crcl }
  })()

  const curb65Score = [confusion, highBUN, highRR, lowBP, age65].filter(Boolean).length
  const curb65Risk =
    curb65Score <= 1
      ? { label: 'Bajo', desc: 'Mortalidad ~3% · Considerar ambulatorio', color: 'text-success' }
      : curb65Score === 2
        ? { label: 'Moderado', desc: 'Mortalidad ~9% · Hospitalizar', color: 'text-warning' }
        : { label: 'Alto', desc: 'Mortalidad >15% · Hospitalizar / UCI', color: 'text-danger' }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-sm px-3 font-medium">
          <Calculator className="mr-1.5 h-4 w-4" />
          Calculadoras
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadoras Clínicas
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="imc" className="mt-1">
          <TabsList className="h-auto w-full justify-start rounded-none border border-border bg-surface p-0">
            {['imc', 'cv', 'renal', 'curb65'].map((tab, i) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className={`rounded-none border-r border-border px-3 py-2 text-xs font-medium ${i === 3 ? 'border-r-0' : ''}`}
              >
                {tab === 'imc' ? 'IMC' : tab === 'cv' ? 'Riesgo CV' : tab === 'renal' ? 'F. Renal' : 'CURB-65'}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── IMC ── */}
          <TabsContent value="imc" className="mt-4 space-y-4">
            <p className="text-xs text-foreground-muted">Índice de Masa Corporal (OMS)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Talla (cm)</Label>
                <Input value={bmiH} onChange={e => setBmiH(e.target.value)} placeholder="170" type="number" className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peso (kg)</Label>
                <Input value={bmiW} onChange={e => setBmiW(e.target.value)} placeholder="70" type="number" className="h-8 text-sm" />
              </div>
            </div>
            {bmiResult ? (
              <div className="grid grid-cols-2 gap-2">
                <ResultBox label="IMC" value={`${bmiResult.bmi}`} sub="kg/m²" />
                <ResultBox label="Clasificación" value={bmiResult.label} color={bmiResult.color} />
              </div>
            ) : (
              <p className="text-center text-sm text-foreground-subtle">Ingrese talla y peso</p>
            )}
            <div className="border border-border bg-surface-alt p-2.5 text-[11px] text-foreground-muted space-y-0.5">
              <p><span className="font-medium">&lt;18.5</span> Bajo peso &nbsp;·&nbsp; <span className="font-medium">18.5–24.9</span> Normal</p>
              <p><span className="font-medium">25–29.9</span> Sobrepeso &nbsp;·&nbsp; <span className="font-medium">≥30</span> Obesidad</p>
            </div>
          </TabsContent>

          {/* ── Riesgo CV (Framingham) ── */}
          <TabsContent value="cv" className="mt-4 space-y-4">
            <p className="text-xs text-foreground-muted">Riesgo cardiovascular a 10 años — Framingham ATP-III</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sexo</Label>
                <SexToggle value={fcSex} onChange={setFcSex} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Edad (años)</Label>
                  <Input value={fcAge} onChange={e => setFcAge(e.target.value)} type="number" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PA Sistólica (mmHg)</Label>
                  <Input value={fcSbp} onChange={e => setFcSbp(e.target.value)} placeholder="120" type="number" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Colesterol total (mg/dL)</Label>
                  <Input value={totalChol} onChange={e => setTotalChol(e.target.value)} placeholder="200" type="number" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">HDL (mg/dL)</Label>
                  <Input value={hdl} onChange={e => setHdl(e.target.value)} placeholder="50" type="number" className="h-8 text-sm" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <CheckboxRow label="En tratamiento antihipertensivo" checked={onBPMeds} onChange={setOnBPMeds} />
                <CheckboxRow label="Fumador activo" checked={smoker} onChange={setSmoker} />
              </div>
            </div>
            {framResult ? (
              <div className="grid grid-cols-3 gap-2">
                <ResultBox label="Puntos" value={`${framResult.points}`} />
                <ResultBox label="Riesgo 10 años" value={`${framResult.risk10y >= 30 ? '≥30' : framResult.risk10y}%`} color={framResult.color} />
                <ResultBox label="Categoría" value={framResult.category.split(' ')[0]} color={framResult.color} />
              </div>
            ) : (
              <p className="text-center text-sm text-foreground-subtle">Complete todos los campos</p>
            )}
          </TabsContent>

          {/* ── Función Renal ── */}
          <TabsContent value="renal" className="mt-4 space-y-4">
            <p className="text-xs text-foreground-muted">eGFR CKD-EPI 2021 + Aclaramiento Creatinina Cockcroft-Gault</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sexo</Label>
                <SexToggle value={renSex} onChange={setRenSex} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Edad (años)</Label>
                  <Input value={renAge} onChange={e => setRenAge(e.target.value)} type="number" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Creatinina sérica (mg/dL)</Label>
                  <Input value={creat} onChange={e => setCreat(e.target.value)} placeholder="1.0" type="number" step="0.01" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Peso (kg) — para CrCl</Label>
                  <Input value={renW} onChange={e => setRenW(e.target.value)} placeholder="70" type="number" className="h-8 text-sm" />
                </div>
              </div>
            </div>
            {renalResult ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <ResultBox
                    label="eGFR (CKD-EPI)"
                    value={`${renalResult.egfr}`}
                    sub="mL/min/1.73m²"
                    color={renalResult.egfr >= 60 ? 'text-success' : renalResult.egfr >= 30 ? 'text-warning' : 'text-danger'}
                  />
                  {renalResult.crcl !== null && (
                    <ResultBox
                      label="CrCl (C-G)"
                      value={`${renalResult.crcl}`}
                      sub="mL/min (dosificación)"
                      color={renalResult.crcl >= 60 ? 'text-success' : renalResult.crcl >= 30 ? 'text-warning' : 'text-danger'}
                    />
                  )}
                </div>
                <div className="border border-border bg-surface-alt px-3 py-2 text-xs text-foreground-muted">
                  Estadio: <span className="font-medium text-foreground">{renalResult.stage}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-foreground-subtle">Ingrese creatinina sérica</p>
            )}
          </TabsContent>

          {/* ── CURB-65 ── */}
          <TabsContent value="curb65" className="mt-4 space-y-4">
            <p className="text-xs text-foreground-muted">Severidad de neumonía adquirida en comunidad (BTS 2001)</p>
            <div className="space-y-2.5">
              <CheckboxRow label="C — Confusión (nueva, orientación/tiempo/lugar)" checked={confusion} onChange={setConfusion} />
              <CheckboxRow label="U — Urea >19 mg/dL (BUN >7 mmol/L)" checked={highBUN} onChange={setHighBUN} />
              <CheckboxRow label={`R — FR ≥30 rpm${rr ? ` (último: ${rr})` : ''}`} checked={highRR} onChange={setHighRR} />
              <CheckboxRow
                label={`B — PA Sistólica <90 mmHg o Diastólica ≤60${sbp || dbp ? ` (último: ${sbp}/${dbp})` : ''}`}
                checked={lowBP}
                onChange={setLowBP}
              />
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-4 w-4 rounded border ${age65 ? 'border-primary bg-primary' : 'border-border bg-surface'} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {age65 ? '✓' : ''}
                </span>
                <span className={age65 ? 'font-medium' : 'text-foreground-muted'}>
                  65 — Edad ≥65 años ({age} años) — {age65 ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ResultBox
                label="Score CURB-65"
                value={`${curb65Score} / 5`}
                color={curb65Risk.color}
              />
              <ResultBox
                label="Riesgo"
                value={curb65Risk.label}
                color={curb65Risk.color}
              />
            </div>
            <div className={`flex items-start gap-2 border px-3 py-2.5 text-xs ${
              curb65Score >= 3
                ? 'border-danger/30 bg-danger/5 text-danger'
                : curb65Score === 2
                  ? 'border-warning/30 bg-warning/5 text-warning'
                  : 'border-success/30 bg-success/5 text-success'
            }`}>
              {curb65Score >= 3 && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <span>{curb65Risk.desc}</span>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
