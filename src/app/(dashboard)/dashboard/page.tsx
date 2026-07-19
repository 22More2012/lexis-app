import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { PackageCheck, PackageMinus, ShoppingCart, ClipboardList, TrendingUp, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const [
    { count: soCount },
    { count: receiveCount },
    { count: deliveryCount },
    { count: pendingApprovals },
    { data: products },
  ] = await Promise.all([
    supabase.from('sales_order_headers').select('*', { count: 'exact', head: true }),
    supabase.from('receive_orders').select('*', { count: 'exact', head: true }),
    supabase.from('delivery_headers').select('*', { count: 'exact', head: true }),
    supabase.from('delivery_headers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('products').select('product_name, total_inventory, product_category').order('product_name').limit(10),
  ])

  const stats = [
    { label: 'Sales Orders', value: soCount ?? 0, icon: ShoppingCart, color: 'bg-purple-500', href: '/dashboard/sales-orders' },
    { label: 'IN Receivings', value: receiveCount ?? 0, icon: PackageCheck, color: 'bg-green-500', href: '/dashboard/receiving' },
    { label: 'OUT Deliveries', value: deliveryCount ?? 0, icon: PackageMinus, color: 'bg-blue-500', href: '/dashboard/deliveries' },
    { label: 'Pending Approvals', value: pendingApprovals ?? 0, icon: ClipboardList, color: 'bg-amber-500', href: '/dashboard/approvals' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Lexis Product Management Overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Pending approvals alert */}
      {(pendingApprovals ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">
            <strong>{pendingApprovals} delivery {pendingApprovals === 1 ? 'order' : 'orders'}</strong> pending approval.{' '}
            <Link href="/dashboard/approvals" className="underline font-medium">Review now →</Link>
          </p>
        </div>
      )}

      {/* Products inventory table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Product Inventory</h2>
          <Link href="/dashboard/products" className="text-blue-600 text-sm font-medium hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Product Name</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Category</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Total Inventory</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products?.map(p => (
                <tr key={p.product_name} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{p.product_name}</td>
                  <td className="px-6 py-3 text-gray-500">{p.product_category ?? '—'}</td>
                  <td className="px-6 py-3 text-right font-mono">{Number(p.total_inventory).toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      Number(p.total_inventory) > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {Number(p.total_inventory) > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No products yet. Add products to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
