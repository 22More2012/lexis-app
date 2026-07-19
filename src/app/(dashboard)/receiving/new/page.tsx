'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewReceivingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    receive_no: '', type_of_receiving: 'purchase_order', wira_po_ref: '',
    so_no: '', delivery_ref: '', product_name: '', quantity: '',
    remaining_qty: '', batch_number: '', wira_po_remark: '',
  })
  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }
    const { error: err } = await supabase.from('receive_orders').insert({
      receive_no: form.receive_no, type_of_receiving: form.type_of_receiving,
      wira_po_ref: form.wira_po_ref || null, so_no: form.so_no || null,
      delivery_ref: form.delivery_ref || null, product_name: form.product_name,
      quantity: parseFloat(form.quantity) || null, remaining_qty: parseFloat(form.remaining_qty) || null,
      batch_number: form.batch_number || null, wira_po_remark: form.wira_po_remark || null,
      created_by: user.id, status: 'pending',
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/receiving'); router.refresh()
  }

  const field = (label: string, key: string, opts?: { type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={opts?.type ?? 'text'} value={(form as any)[key]} onChange={e => set(key, e.target.value)}
        placeholder={opts?.placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/receiving" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900">New Receipt</h1><p className="text-gray-500 text-sm">Record an incoming product receipt</p></div>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field('Receive No *', 'receive_no', { placeholder: 'e.g. RCV-2024-001' })}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type of Receiving</label>
            <select value={form.type_of_receiving} onChange={e => set('type_of_receiving', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="purchase_order">Purchase Order</option>
              <option value="wira">WIRA</option>
              <option value="sales_return">Sales Return</option>
              <option value="transfer">Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          {field('WIRA / PO Ref', 'wira_po_ref', { placeholder: 'Reference number' })}
          {field('SO No', 'so_no', { placeholder: 'Linked sales order' })}
          {field('Delivery Ref', 'delivery_ref', { placeholder: 'Delivery reference' })}
          {field('Product Name', 'product_name', { placeholder: 'Product name' })}
          {field('Quantity', 'quantity', { type: 'number', placeholder: '0' })}
          {field('Remaining Qty', 'remaining_qty', { type: 'number', placeholder: '0' })}
          {field('Batch Number', 'batch_number', { placeholder: 'Batch #' })}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea value={form.wira_po_remark} onChange={e => set('wira_po_remark', e.target.value)}
            rows={3} placeholder="Additional remarks..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2.5 rounded-lg font-medium text-sm">
            {loading ? 'Saving...' : 'Create Receipt'}
          </button>
          <Link href="/receiving" className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
