import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus, ShoppingCart } from 'lucide-react'

const statusColors: Record<string, string> = {
  Draft:     'bg-gray-100 text-gray-600',
  Approved:  'bg-blue-100 text-blue-700',
  Received:  'bg-purple-100 text-purple-700',
  Billed:    'bg-orange-100 text-orange-700',
  Paid:      'bg-green-100 text-green-700',
}

// Lifecycle step index for progress bar
const STEPS = ['Draft', 'Approved', 'Received', 'Billed', 'Paid']

export default async function PurchasingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: orders } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60)

  const total = orders?.reduce((s, o) => s + (o.bill_amount ?? 0), 0) ?? 0
  const open  = orders?.filter(o => o.status !== 'Paid').length ?? 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchasing</h1>
          <p className="text-gray-500 text-sm mt-1">
            {open} open POs Â· â±{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })} total payable
          </p>
        </div>
        <Link href="/purchasing/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> New Purchase Order
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">PO No</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Supplier</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Location</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Lifecycle</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders?.map(o => {
              const stepIdx = STEPS_indexOf(o.status)
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-blue-600">
                    <Link href={`/purchasing/${o.id}`} className="hover:underline">
                      {o.po_no}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-800">{c.supplier_name ?? 'â'}</td>
                  <td className="px-6 py-3 text-gray-600">{c.date}</td>
                  <td className="px-6 py-3 text-gray-600">{c.location ?? 'â'}</td>
                  <td className="px-6 py-3">
                    {/* Mini lifecycle dots */}
                    <div className="flex items-center gap-1">
                      {STEPS.map((s, i) => (
                        <div key={s} className={`w-2 h-2 rounded-full ${
                          i < stepIdx ? 'bg-green-400' :
                          i === stepIdx ? 'bg-blue-500' : 'bg-gray-200'
                        }`} title={s}/>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700 font-medium">
                    {o.bill_amount != null
                      ? `â±$îçer.bill_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                      : 'â'}
                  </td>
                </tr>
              )
            })}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-3 text-gray-300"/>
                  No purchase orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
