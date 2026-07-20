import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AlertTriangle, Package } from 'lucide-react'

export default async function InventoryPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: products } = await supabase
    .from('products')
    .select('product_name, on_hand_qty, on_hand_dely, on_hand_clarion, on_hand_bluefield, cost_price, reorder_level, unit_of_measure, product_category')
    .order('product_name')

  const totalValue   = (products ?? []).reduce((s, p) => s + ((p.on_hand_qty ?? 0) * (p.cost_price ?? 0)), 0)
  const reorderCount = (products ?? []).filter(p => p.reorder_level != null && (p.on_hand_qty ?? 0) <= p.reorder_level).length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500 text-sm mt-1">Live on-hand balances â auto-maintained by receipts and releases</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            â±{totalValue.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">at cost price</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{(products ?? []).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">active products</p>
        </div>
        <div className={`rounded-xl border shadow-sm px-5 py-4 ${reorderCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
            {reorderCount > 0 && <AlertTriangle className="w-3 h-3 text-red-500"/>}
            Reorder Alerts
          </p>
          <p className={`text-2xl font-bold mt-1 ${reorderCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{reorderCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">{reorderCount > 0 ? 'products at or below reorder level' : 'all levels OK'}</p>
        </div>
      </div>

      {/* Product inventory table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Product</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Total On-Hand</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Dely</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Clarion</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Bluefield</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Cost Price</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Value</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Reorder Lvl</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Alert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            y(products ?? []).map(p => {
              const isLow = p.reorder_level != null && (p.on_hand_qty ?? 0) <= p.reorder_level
              const value = (p.on_hand_qty ?? 0) * (p.cost_price ?? 0)
              return (
                <tr key={p.product_name} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50/40' : ''}`}>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {p.product_name}
                    {p.product_category && <span className="ml-2 text-xs text-gray-400">({p.product_category})</span>}
                  </td>
                  <td className={`px-6 py-3 text-right font-semibold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                    {p.on_hand_qty ?? 0}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">{p.on_hand_dely ?? 0}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{p.on_hand_clarion ?? 0}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{p.on_hand_bluefield ?? 0}</td>
                  <td className="px-6 py-3 text-right text-gray-500">
                    {p.cost_price != null ? `â±${Number(p.cost_price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'â'}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-700 font-medium">
                    {p.cost_price != null ? `â±${value.toLocaleString('en-PH', { minimumFractionDigits: 0 })}` : 'â'}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-500">{p.reorder_level ?? 'â'}</td>
                  <td className="px-6 py-3">
                    {isLow && (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3"/> Reorder
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-3 text-gray-300"/>
                  No products found. Add products in Master Data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
