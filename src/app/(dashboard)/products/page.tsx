import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function ProductsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('product_name')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 text-sm mt-1">Product master list and inventory levels</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Product Name</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Category</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Supplier</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Total Inv.</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Dely</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Clarion</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Bluefield</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products?.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{p.product_name}</td>
                <td className="px-6 py-3 text-gray-500">{p.product_category ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500">{p.supplier_id ?? '—'}</td>
                <td className="px-6 py-3 text-right font-mono font-medium">
                  <span className={Number(p.total_inventory) <= 0 ? 'text-red-500' : 'text-gray-900'}>
                    {Number(p.total_inventory).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-mono text-gray-600">{Number(p.ttl_dely_inv).toLocaleString()}</td>
                <td className="px-6 py-3 text-right font-mono text-gray-600">{Number(p.ttl_clarion_inv).toLocaleString()}</td>
                <td className="px-6 py-3 text-right font-mono text-gray-600">{Number(p.ttl_bluefield_inv).toLocaleString()}</td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No products yet. Ask your admin to add products.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
