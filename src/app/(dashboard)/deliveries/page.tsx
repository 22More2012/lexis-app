import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-gray-100 text-gray-700',
}

export default async function DeliveriesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: deliveries } = await supabase
    .from('delivery_headers')
    .select('*, locations(location_name), vehicles(vehicle_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OUT — Deliveries</h1>
          <p className="text-gray-500 text-sm mt-1">All outgoing delivery orders</p>
        </div>
        <Link href="/dashboard/deliveries/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Delivery
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">OUT No</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Location</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Vehicle</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Trip Ticket</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {deliveries?.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-blue-600">{d.out_no}</td>
                <td className="px-6 py-3 text-gray-600">{d.date}</td>
                <td className="px-6 py-3 text-gray-700">{(d.locations as any)?.location_name ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500 capitalize">{d.type_of_releasing?.replace('_', ' ') ?? '—'}</td>
                <td className="px-6 py-3 text-gray-700">{(d.vehicles as any)?.vehicle_name ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500">{d.trip_ticket_no ?? '—'}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!deliveries || deliveries.length === 0) && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No delivery orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
