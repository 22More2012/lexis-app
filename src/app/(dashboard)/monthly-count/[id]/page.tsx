'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react'

type Count = { id: string; count_period: string; count_date: string; status: string; notes: string | null; posted_at: string | null }
type CountItem = { id: string; product_name: string; system_qty: number; physical_qty: number | null; variance: number | null }

export default function MonthlyCountDetailPage() {
  const params   = useParams()
  const id       = params.id as string
  const supabase = createClient()

  const [count, setCount]       = useState<Count | null>(null)
  const [items, setItems]       = useState<CountItem[]>([])
  const [physical, setPhysical] = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [posting, setPosting]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  async function load() {
    const [{ data: c }, { data: itms }] = await Promise.all([
      supabase.from('monthly_counts').select('*').eq('id', id).single(),
      supabase.from('monthly_count_items').select('*').eq('count_id', id).order('product_name'),
    ])
    setCount(c)
    setItems(itms ?? [])
    // Pre-fill already saved physical counts
    const pre: Record<string, string> = {}
    itms?.forEach(i => { if (i.physical_qty !== null) pre[i.id] = String(i.physical_qty) })
    setPhysical(pre)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // Save all physical counts
  async function saveCounts() {
    setSaving(true)
    setError('')
    const updates = items
      .filter(i => physical[i.id] !== undefined && physical[i.id] !== '')
      .map(i => supabase.from('monthly_count_items').update({ physical_qty: parseFloat(physical[i.id]) || 0 }).eq('id', i.id))
    await Promise.all(updates)
    await load()
    setSuccess('Physical counts saved.')
    setSaving(false)
  }

  // Post count â reconciles inventory
  async function postCount() {
    if (!count) return
    const unkeyed = items.filter(i => physical[i.id] === undefined || physical[i.id] === '')
    if (unkeyed.length > 0) {
      setError(`${unkeyed.length} item(s) still need a physical count before posting.`)
      return
    }
    await saveCounts()
    setPosting(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('monthly_counts')
      .update({ status: 'Posted', posted_by: user?.id })
      .eq('id', id)
    if (err) { setError(err.message); setPosting(false); return }
    setSuccess('Count posted â system inventory reconciled to physical counts.')
    await load()
    setPosting(false)
  }

  if (loading) return <div className="p-8 text-gray-400">Loadingâ¦</div>
  if (!count) return <div className="p-8 text-gray-500">Count not found.</div>

  const isOpen     = count.status === 'Open'
  const totalVar   = items.reduce((s, i) => s + (i.variance ?? 0), 0)
  const negCount   = items.filter(i => (i.variance ?? 0) < 0).length
  const posCount   = items.filter(i => (i.variance ?? 0) > 0).length

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/monthly-count" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5"/></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Count: {count.count_period}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              count.status === 'Posted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>{count.status}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {count.count_date} {count.posted_at && `Â· Posted ${new Date(count.posted_at).toLocaleDateString('en-PH')}`}
          </p>
        </div>
        {isOpen && (
          <div className="flex gap-2">
            <button onClick={saveCounts} disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              {saving ? 'Savingâ¦' : 'Save Counts'}
            </button>
            <button onClick={postCount} disabled={posting || saving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2 rounded-lg text-sm font-medium">
              <CheckCircle className="w-4 h-4"/>
              {posting ? 'Postingâ¦' : 'Post & Reconcile'}
            </button>
          </div>
        )}
      </div>

      {error   && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}</div>}
      {success && <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"><CheckCircle className="w-4 h-4 flex-shrink-0"/>{success}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Items</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
        </div>
        <div className={`rounded-xl border shadow-sm px-5 py-4 ${negCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Short ({negCount} SKUs)</p>
          <p className={`text-2xl font-bold mt-1 ${negCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {negCount > 0 ? `â` : ''}
            {items.filter(i => (i.variance ?? 0) < 0).reduce((s, i) => s + Math.abs(i.variance ?? 0), 0)}
          </p>
        </div>
        <div className={`rounded-xl border shadow-sm px-5 py-4 ${posCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Overage ({posCount} SKUs)</p>
          <p className={`text-2xl font-bold mt-1 ${posCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
            {items.filter(i => (i.variance ?? 0) > 0).reduce((s, i) => s + (i.variance ?? 0), 0)}
          </p>
        </div>
      </div>

      {!isOpen && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          This count has been <strong>posted</strong>. System inventory was reconciled to physical counts.
          Physical counts are now read-only.
        </div>
      )}
      {isOpen && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Key in physical quantities for each product. Red rows indicate shortages. Click <strong>Save Counts</strong> to preserve, or <strong>Post & Reconcile</strong> to finalize.
        </div>
      )}

      {/* Count table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-left text-xs font-medium text-gray-500">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3 text-right">System Qty</th>
              <th className="px-6 py-3 text-right">Physical Qty</th>
              <th className="px-6 py-3 text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => {
              const phys = physical[item.id] !== undefined ? parseFloat(physical[item.id]) : item.physical_qty
              const variance = phys !== null && phys !== undefined && !isNaN(phys as number)
                ? (phys as number) - item.system_qty : item.variance
              const isShort = (variance ?? 0) < 0
              const isOver  = (variance ?? 0) > 0

              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${isShort ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-3 font-medium text-gray-900">{item.product_name}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{item.system_qty}</td>
                  <td className="px-6 py-3 text-right">
                    {isOpen ? (
                      <input
                        type="number" min="0" step="0.01"
                        value={physical[item.id] ?? ''}
                        onChange={e => setPhysical(p => ({ ...p, [item.id]: e.target.value }))}
                        placeholder={String(item.system_qty)}
                        className={`w-28 text-right border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 ${
                          isShort ? 'border-red-300 focus:ring-red-400 bg-red-50' :
                          isOver  ? 'border-blue-300 focus:ring-blue-400 bg-blue-50' :
                          'border-gray-200 focus:ring-blue-400'
                        }`}
                      />
                    ) : (
                      <span className="text-gray-700">{item.physical_qty ?? 'â'}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {variance !== null && variance !== undefined ? (
                      <span className={`flex items-center justify-end gap-1 font-medium ${
                        isShort ? 'text-red-600' : isOver ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {isShort ? <TrendingDown className="w-3 h-3"/> : isOver ? <TrendingUp className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
                        {isShort ? '' : isOver ? '+' : ''}{variance}
                      </span>
                    ) : <span className="text-gray-300">â</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
