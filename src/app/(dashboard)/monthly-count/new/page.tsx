'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function NewMonthlyCountPage() {
  const router  = useRouter()
  const supabase = createClient()

  const now = new Date()
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [period, setPeriod]   = useState(defaultPeriod)
  const [date, setDate]       = useState(now.toISOString().split('T')[0])
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!period) { setError('Period is required (e.g. 2026-07)'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Create count header
    const { data: count, error: cErr } = await supabase
      .from('monthly_counts')
      .insert({ count_period: period, count_date: date, notes, status: 'Open', created_by: user?.id })
      .select('id')
      .single()

    if (cErr || !count) { setError(cErr?.message ?? 'Failed'); setSaving(false); return }

    // 2. Snapshot current system qty for all products
    const { data: products } = await supabase
      .from('products')
      .select('product_name, on_hand_qty')
      .order('product_name')

    if (products && products.length > 0) {
      const snapRows = products.map(p => ({
        count_id:     count.id,
        product_name: p.product_name,
        system_qty:   p.on_hand_qty ?? 0,
        physical_qty: null,
      }))
      await supabase.from('monthly_count_items').insert(snapRows)
    }

    router.push(`/monthly-count/${count.id}`)
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/monthly-count" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5"/>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Monthly Count</h1>
          <p className="text-gray-500 text-sm">Snapshots current system qty for all products</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0"/> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Period <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(YYYY-MM)</span>
          </label>
          <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="2026-07"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Count Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
          Opening a count will snapshot <strong>current on-hand quantities</strong> for all products.
          You will then key in the physical count and flag variances before posting.
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Link href="/monthly-count" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</Link>
          <button type="submit" disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg font-medium text-sm">
            {saving ? 'Opening countâ¦' : 'Open Count'}
          </button>
        </div>
      </form>
    </div>
  )
}
