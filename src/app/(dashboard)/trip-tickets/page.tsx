import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function TripTicketsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: trips } = await supabase
    .from('trip_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trip Tickets</h1>
        <p className="text-gray-500 text-sm mt-1">Delivery trip management</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Trip Ticket No</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Area</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Gas Report</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Remarks</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {trips?.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-blue-600">{t.trip_ticket_no}</td>
                <td className="px-6 py-3 text-gray-600">{t.date_of_delivery}</td>
                <td className="px-6 py-3 text-gray-700">{t.area ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500">{t.gas_report_no ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500">{t.remarks ?? '—'}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {t.status?.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {(!trips || trips.length === 0) && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No trip tickets yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
