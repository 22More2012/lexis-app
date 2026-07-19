'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

type Delivery = {
  id: string
  out_no: string
  date: string
  status: string
  type_of_releasing: string
  locations?: { location_name: string }
}

export default function ApprovalsPage() {
  const supabase = createClient()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase
      .from('delivery_headers')
      .select('*, locations(location_name)')
      .in('status', ['pending'])
      .order('created_at', { ascending: false })
    setDeliveries((data as any[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    setActionLoading(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('delivery_headers').update({
      status: action,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    }).eq('id', id)
    await load()
    setActionLoading(null)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve pending delivery orders</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-medium text-gray-700">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{d.out_no}</p>
                  <p className="text-sm text-gray-500">
                    {d.date} · {(d.locations as any)?.location_name ?? 'Unknown location'} · {d.type_of_releasing?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAction(d.id, 'rejected')}
                  disabled={actionLoading === d.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleAction(d.id, 'approved')}
                  disabled={actionLoading === d.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
