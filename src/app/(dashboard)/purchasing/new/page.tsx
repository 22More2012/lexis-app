'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type Supplier = { id: string; supplier_name: string; payment_terms: string | null }
type Product  = { product_name: string; cost_price: number | null; on_hand_qty: number | null; reorder_level: number | null }
type LineItem = { product_name: string; quantity: number; unit_cost: number }

const LOCATIONS = ['Dely (DY)', 'Clarion (CN)', 'Bluefield (BD)']

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const supabase = createClient()

  const [suppliers, setSuppliers]   = useState<Supplier[]>([])
  const [products, setProducts]     = useState<Product[]>([])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  // Header fields
  const [supplierId, setSupplierId]         = useState('')
  const [supplierName, setSupplierName]     = useState('')
  const [date, setDate]                     = useState(new Date().toISOString().split('T')[0])
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [location, setLocation]             = useState('')
  const [notes, setNotes]                   = useState('')

  // Line items
  const [items, setItems] = useState<LineItem[]>([{ product_name: '', quantity: 1, unit_cost: 0 }])

  useEffect(() => {
    supabase.from('suppliers').select('id, supplier_name, payment_terms').eq('is_active', true).then(r => setSuppliers(r.data ?? []))
    supabase.from('products').select('product_name, cost_price, on_hand_qty, reorder_level').order('product_name').then(r => setProducts(r.data ?? []))
  }, [])

  function addItem() {
    setItems(prev => [...prev, { product_name: '', quantity: 1, unit_cost: 0 }])
  }
  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      // Auto-fill cost price from products table
      if (field === 'product_name') {
        const prod = products.find(p => p.product_name === value)
        if (prod?.cost_price) updated.unit_cost = prod.cost_price
      }
      return updated
    }))
  }

  const grandTotal = items.reduce((s, i) => s + (i.quantity * i.unit_cost), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplierName) { setError('Supplier is required.'); return }
    if (items.some(i => !i.product_name)) { setError('All line items must have a product.'); return }

    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    const { data: po, error: poErr } = await supabase
      .from('purchase_orders')
      .insert({
        supplier_id: supplierId || null,
        supplier_name: supplierName,
        date,
        expected_delivery: expectedDelivery || null,
        location,
        notes,
        status: 'Draft',
        created_by: user?.id,
      })
      .select('po_no')
      .single()

    if (poErr || !po) { setError(poErr?.message ?? 'Failed to create PO'); setSaving(false); return }

    const lineItems = items.map(i => ({
      po_no: po.po_no,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_cost: i.unit_cost,
    }))

    const { error: itemErr } = await supabase.from('purchase_order_items').insert(lineItems)
    if (itemErr) { setError(itemErr.message); setSaving(false); return }

    router.push(`/purchasing/${po.po_no}`)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/purchasing" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
          <p className="text-gray-500 text-sm">PO No will be auto-assigned on save</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier <span className="text-red-500">*</span></label>
              <select
                value={supplierId}
                onChange={e => {
                  setSupplierId(e.target.value)
                  const sup = suppliers.find(s => s.id === e.target.value)
                  setSupplierName(sup?.supplier_name ?? '')
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select supplierâ¦</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplier_name} {s.payment_terms ? `(${s.payment_terms})` : ''}</option>
                ))}
              </select>
              {!supplierId && (
                <input
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="Or type supplier nameâ¦"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600"/>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select value={location} onChange={e => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select locationâ¦</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
              <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Items</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Line
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs font-medium text-gray-500">
                <th className="pb-2 pr-3">Product</th>
                <th className="pb-2 pr-3 w-24">Qty</th>
                <th className="pb-2 pr-3 w-32">Unit Cost (â±)</th>
                <th className="pb-2 pr-3 w-32">Total</th>
                <th className="pb-2 w-8"/>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const prod = products.find(p => p.product_name === item.product_name)
                const lowStock = prod && prod.on_hand_qty !== null && prod.reorder_level !== null && prod.on_hand_qty <= prod.reorder_level
                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 pr-3">
                      <select
                        value={item.product_name}
                        onChange={e => updateItem(i, 'product_name', e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                        <option value="">Select productâ¦</option>
                        {products.map(p => (
                          <option key={p.product_name} value={p.product_name}>{p.product_name}</option>
                        ))}
                      </select>
                      {lowStock && (
                        <p className="text-xs text-orange-500 mt-0.5">â  Low stock: {prod.on_hand_qty} on hand</p>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min="0" value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"/>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="number" min="0" step="0.01" value={item.unit_cost}
                        onChange={e => updateItem(i, 'unit_cost', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"/>
                    </td>
                    <td className="py-2 pr-3 text-gray-700 font-medium">
                      â±{(item.quantity * item.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <p className="text-sm text-gray-500">Grand Total</p>
            <p className="text-xl font-bold text-gray-900">
              â±{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/purchasing"
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg font-medium text-sm">
            {saving ? 'Savingâ¦' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  )
}
