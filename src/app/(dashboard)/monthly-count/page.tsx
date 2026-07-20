import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'

export default async function MonthlyCountPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: counts } = await supabase
    .from('monthly_counts')
    .select('*')
    .order('count_date', { ascending: false })
    .limit(24)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Count</h1>
          <p className="text-gray-500 text-sm mt-1">Physical inventory reconciliation by period</p>
        </div>
        <Link href="/monthly-count/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Count
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Period</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Count Date</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Posted At</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {counts?.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-blue-600">
                  <Link href={`/monthly-count/${c.id}`} className="hover:underline">{c.count_period}</Link>
                </td>
                <td className="px-6 py-3 text-gray-600">{c.count_date}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'Posted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{c.status}</span>
                </td>
                <td className="px-6 py-3 text-gray-500">
                  {c.posted_at ? new Date(c.posted_at).toLocaleDateString('en-PH') : 'â'}
                </td>
                <td className="px-6 py-3 text-gray-500 truncate max-w-xs">{c.notes ?? 'â'}</td>
              </tr>
            ))}
            {(!counts || counts.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                  <ClipboardList className="w-8 h-8 mx-auto mb-3 text-gray-300"/>
                  No count periods yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
