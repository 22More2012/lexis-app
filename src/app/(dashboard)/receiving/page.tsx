import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
}

export default async function ReceivingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: records } = await supabase
    .from('receive_orders')
    .select('*, locations(location_name), products(product_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IN — Receiving</h1>
          <p className="text-gray-500 text-sm mt-1">All incoming product receipts</p>
        </div>
        <Link href="/dashboard/receiving/new"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Receipt
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Receive No</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Type</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Location</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Product</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Quantity</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Ref</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records?.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-green-600">{r.receive_no}</td>
                <td className="px-6 py-3 text-gray-500 capitalize">{r.type_of_receiving?.replace('_', ' ') ?? '—'}</td>
                <td className="px-6 py-3 text-gray-700">{(r.locations as any)?.location_name ?? '—'}</td>
                <td className="px-6 py-3 text-gray-700">{(r.products as any)?.product_name ?? r.product_name ?? '—'}</td>
                <td className="px-6 py-3 text-right font-mono">{r.quantity ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500">{r.wira_po_ref ?? r.delivery_ref ?? '—'}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!records || records.length === 0) && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No receiving records yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
