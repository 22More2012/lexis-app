'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { UserCheck, Shield, Eye } from 'lucide-react'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'staff' | 'viewer'
  is_active: boolean
}

const roleIcons = {
  admin: <Shield className="w-4 h-4 text-purple-500" />,
  staff: <UserCheck className="w-4 h-4 text-blue-500" />,
  viewer: <Eye className="w-4 h-4 text-gray-400" />,
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  staff: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-700',
}

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('user_profiles').select('*').order('email')
    setUsers((data as Profile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateRole(id: string, role: string) {
    setSaving(id)
    await supabase.from('user_profiles').update({ role }).eq('id', id)
    await load()
    setSaving(null)
  }

  async function toggleActive(id: string, current: boolean) {
    setSaving(id)
    await supabase.from('user_profiles').update({ is_active: !current }).eq('id', id)
    await load()
    setSaving(null)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage roles and access for all users</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        <strong>To invite a new user:</strong> go to your Supabase dashboard → Authentication → Users → Invite user. They'll receive an email to set their password. Then assign their role here.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">User</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.full_name ?? u.email}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    {roleIcons[u.role]}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role]}`}>
                      {u.role}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                      <option value="viewer">Viewer</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => toggleActive(u.id, u.is_active)}
                      disabled={saving === u.id}
                      className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50">
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
