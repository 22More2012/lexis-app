import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  partial: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-700',
}

export default async function SalesOrdersPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: orders } = await supabase
    .from('sales_order_headers')
    .select('*, customers(customer_name)')
    .order('created_at', { ascending: false })
    .limit(50)
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all sales orders (IN)</p>
        </div>
        <Link href="/sales-orders/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Sales Order
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">SO No</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Customer</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders?.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-blue-600">{o.so_no}</td>
                <td className="px-6 py-3 text-gray-600">{o.date}</td>
                <td className="px-6 py-3 text-gray-700">{(o.customers as any)?.customer_name ?? o.company ?? '—'}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] ?? 'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No sales orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
