'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface DeliveryItem {
  product_name: string
  quantity: string
  qty_in_drum: string
  batch_number: string
  remarks: string
}

export default function NewDeliveryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [header, setHeader] = useState({
    out_no: '',
    date: new Date().toISOString().split('T')[0],
    type_of_releasing: 'delivery',
    trip_ticket_no: '',
  })

  const [items, setItems] = useState<DeliveryItem[]>([
    { product_name: '', quantity: '', qty_in_drum: '', batch_number: '', remarks: '' }
  ])

  function addItem() { setItems([...items, { product_name: '', quantity: '', qty_in_drum: '', batch_number: '', remarks: '' }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: keyof DeliveryItem, value: string) {
    const u = [...items]; u[i][field] = value; setItems(u)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { error: hErr } = await supabase.from('delivery_headers').insert({
      out_no: header.out_no,
      date: header.date,
      type_of_releasing: header.type_of_releasing,
      trip_ticket_no: header.trip_ticket_no || null,
      submitted_by: user.id,
      status: 'pending',
    })

    if (hErr) { setError(hErr.message); setLoading(false); return }

    const { error: iErr } = await supabase.from('delivery_items').insert(
      items.filter(i => i.product_name).map(i => ({
        out_no: header.out_no,
        product_name: i.product_name,
        quantity: parseFloat(i.quantity) || null,
        qty_in_drum: parseFloat(i.qty_in_drum) || null,
        batch_number: i.batch_number || null,
        remarks: i.remarks || null,
        status: 'pending',
      }))
    )

    if (iErr) { setError(iErr.message); setLoading(false); return }
    router.push('/deliveries')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/deliveries" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Delivery</h1>
          <p className="text-gray-500 text-sm">Create a new delivery order (OUT)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Delivery Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OUT No *</label>
              <input required value={header.out_no} onChange={e => setHeader({...header, out_no: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. OUT-2024-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={header.date} onChange={e => setHeader({...header, date: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of Releasing</label>
              <select value={header.type_of_releasing} onChange={e => setHeader({...header, type_of_releasing: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="delivery">Delivery</option>
                <option value="pick_up">Pick Up</option>
                <option value="transfer">Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Ticket No</label>
              <input value={header.trip_ticket_no} onChange={e => setHeader({...header, trip_ticket_no: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Trip ticket reference" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Products to Deliver</h2>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-3">Product Name</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Qty in Drum</div>
              <div className="col-span-2">Batch No</div>
              <div className="col-span-2">Remarks</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                  <input value={item.product_name} onChange={e => updateItem(i, 'product_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product" />
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.qty_in_drum} onChange={e => updateItem(i, 'qty_in_drum', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <input value={item.batch_number} onChange={e => updateItem(i, 'batch_number', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Batch #" />
                </div>
                <div className="col-span-2">
                  <input value={item.remarks} onChange={e => updateItem(i, 'remarks', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Notes" />
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
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg font-medium text-sm">
            {loading ? 'Saving...' : 'Create Delivery Order'}
          </button>
          <Link href="/deliveries"
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
