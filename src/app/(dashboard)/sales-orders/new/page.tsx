'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface OrderItem {
  product_name: string
  quantity: string
  unit_price: string
  batch_number: string
}

export default function NewSalesOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [header, setHeader] = useState({
    so_no: '',
    date: new Date().toISOString().split('T')[0],
    company: '',
    purchase_order_no: '',
    type_of_order: 'regular',
    requirements: '',
  })

  const [items, setItems] = useState<OrderItem[]>([
    { product_name: '', quantity: '', unit_price: '', batch_number: '' }
  ])

  function addItem() {
    setItems([...items, { product_name: '', quantity: '', unit_price: '', batch_number: '' }])
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof OrderItem, value: string) {
    const updated = [...items]
    updated[i][field] = value
    setItems(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const totalQty = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0)

    const { error: headerErr } = await supabase.from('sales_order_headers').insert({
      ...header,
      total_so_qty: totalQty,
      created_by: user.id,
      status: 'pending',
    })

    if (headerErr) { setError(headerErr.message); setLoading(false); return }

    const { error: itemsErr } = await supabase.from('sales_order_items').insert(
      items.filter(i => i.product_name).map(i => ({
        so_no: header.so_no,
        product_name: i.product_name,
        quantity: parseFloat(i.quantity) || 0,
        unit_price: parseFloat(i.unit_price) || 0,
        total_price: (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0),
        batch_number: i.batch_number,
      }))
    )

    if (itemsErr) { setError(itemsErr.message); setLoading(false); return }

    router.push('/dashboard/sales-orders')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/sales-orders" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Sales Order</h1>
          <p className="text-gray-500 text-sm">Create a new sales order (IN)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SO Number *</label>
              <input required value={header.so_no} onChange={e => setHeader({...header, so_no: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. SO-2024-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={header.date} onChange={e => setHeader({...header, date: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input value={header.company} onChange={e => setHeader({...header, company: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
              <input value={header.purchase_order_no} onChange={e => setHeader({...header, purchase_order_no: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Purchase order ref" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <select value={header.type_of_order} onChange={e => setHeader({...header, type_of_order: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="regular">Regular</option>
                <option value="sample">Sample</option>
                <option value="blanket">Blanket</option>
                <option value="wira">WIRA</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
              <input value={header.requirements} onChange={e => setHeader({...header, requirements: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special requirements" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Products</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-4">Product Name</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-3">Batch Number</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <input value={item.product_name} onChange={e => updateItem(i, 'product_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product name" />
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0" />
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00" />
                </div>
                <div className="col-span-3">
                  <input value={item.batch_number} onChange={e => updateItem(i, 'batch_number', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Batch #" />
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
            {loading ? 'Saving...' : 'Create Sales Order'}
          </button>
          <Link href="/dashboard/sales-orders"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
