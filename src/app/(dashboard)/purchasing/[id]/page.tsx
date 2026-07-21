'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, Package, FileText, CreditCard,
  AlertCircle, Clock, ChevronRight
} from 'lucide-react'

type PO = {
  id: string; po_no: string; supplier_name: string | null; supplier_id: string | null
  date: string; expected_delivery: string | null; location: string | null
  status: string; notes: string | null; bill_amount: number | null
  bill_no: string | null; bill_due_date: string | null; billed_at: string | null
  approved_at: string | null; received_at: string | null; paid_at: string | null
  collection_receipt_no: string | null; amount_paid: number | null
  payment_method: string | null
}
type POItem = {
  id: string; product_name: string; quantity: number; unit_cost: number
  total_cost: number; received_qty: number | null; batch_number: string | null
}

const STEPS = [
  { key: 'Draft', label: 'Draft', icon: Clock },
  { key: 'Approved', label: 'Approved', icon: CheckCircle },
  { key: 'Received', label: 'Received', icon: Package },
  { key: 'Billed', label: 'Billed', icon: FileText },
  { key: 'Paid', label: 'Paid', icon: CreditCard },
]

export default function PurchasingDetailPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [po, setPo] = useState<PO | null>(null)
  const [items, setItems] = useState<POItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [billNo, setBillNo] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billDueDate, setBillDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [checkNo, setCheckNo] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [showBillForm, setShowBillForm] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)

  async function load() {
    let { data: poData } = await supabase.from('purchase_orders').select('*').eq('id', id).single()
    if (!poData) {
      const r = await supabase.from('purchase_orders').select('*').eq('po_no', id).single()
      poData = r.data
    }
    setPo(poData)
    if (poData) {
      const { data: itemData } = await supabase.from('purchase_order_items').select('*').eq('po_no', poData.po_no).order('created_at')
      setItems(itemData ?? [])
      setBillAmount(poData.bill_amount?.toString() ?? '')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function transition(newStatus: string, extra?: Record<string, unknown>) {
    if (!po) return
    setSaving(newStatus); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const update: Record<string, unknown> = { status: newStatus, ...extra }
    if (newStatus === 'Approved') update.approved_by = user?.id
    if (newStatus === 'Received') update.received_by = user?.id
    if (newStatus === 'Paid') update.paid_by = user?.id
    const { error: err } = await supabase.from('purchase_orders').update(update).eq('id', po.id)
    if (err) { setError(err.message); setSaving(''); return }
    if (newStatus === 'Paid') {
      await supabase.from('collection_receipts').insert({
        po_no: po.po_no, supplier_name: po.supplier_name,
        amount_paid: parseFloat(amountPaid) || po.bill_amount,
        payment_method: paymentMethod, check_no: checkNo || null, created_by: user?.id,
      })
    }
    setSuccess(`PO ${newStatus}.`)
    await load()
    setSaving(''); setShowBillForm(false); setShowPayForm(false)
  }

  if (loading) return <div className="p-8 text-gray-400">Loadingâ¦</div>
  if (!po) return <div className="p-8 text-gray-500">Purchase order not found.</div>

  const stepIdx = STEPS.findIndex(s => s.key === po.status)
  const grandTotal = items.reduce((s, i) => s + (i.total_cost ?? 0), 0)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/purchasing" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5"/></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{po.po_no}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              po.status === 'Paid' ? 'bg-green-100 text-green-700' :
              po.status === 'Billed' ? 'bg-orange-100 text-orange-700' :
              po.status === 'Received' ? 'bg-purple-100 text-purple-700' :
              po.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'}`}>{po.status}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{po.supplier_name ?? 'â'} Â· {po.date} Â· {po.location ?? 'No location'}</p>
        </div>
      </div>
      {error && <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}</div>}
      {success && <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"><CheckCircle className="w-4 h-4 flex-shrink-0"/>{success}</div>}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Lifecycle</h2>
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const done = i < stepIdx; const current = i === stepIdx
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                    done ? 'bg-green-500 border-green-500 text-white' :
                    current ? 'bg-blue-500 border-blue-500 text-white' :
                    'bg-white border-gray-200 text-gray-300'}`}><Icon className="w-4 h-4"/></div>
                  <p className={`text-xs mt-1 font-medium ${done ? 'text-green-600' : current ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</p>
                  {step.key === 'Approved' && po.approved_at && <p className="text-xs text-gray-400">{new Date(po.approved_at).toLocaleDateString('en-PH')}</p>}
                  {step.key === 'Received' && po.received_at && <p className="text-xs text-gray-400">{new Date(po.received_at).toLocaleDateString('en-PH')}</p>}
                  {step.key === 'Billed' && po.billed_at && <p className="text-xs text-gray-400">{new Date(po.billed_at).toLocaleDateString('en-PH')}</p>}
                  {step.key === 'Paid' && po.paid_at && <p className="text-xs text-gray-400">{new Date(po.paid_at).toLocaleDateString('en-PH')}</p>}
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < stepIdx ? 'bg-green-400' : 'bg-gray-200'}`}/>}
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex gap-3 flex-wrap">
          {po.status === 'Draft' && <button onClick={() => transition('Approved')} disabled={!!saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"><CheckCircle className="w-4 h-4"/>{saving === 'Approved' ? 'Approvingâ¦' : 'Approve PO'}</button>}
          {po.status === 'Approved' && <button onClick={() => transition('Received')} disabled={!!saving} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"><Package className="w-4 h-4"/>{saving === 'Received' ? 'Markingâ¦' : 'Mark as Received'}</button>}
          {po.status === 'Received' && !showBillForm && <button onClick={() => setShowBillForm(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium"><FileText className="w-4 h-4"/> Record Supplier Bill</button>}
          {po.status === 'Billed' && !showPayForm && <button onClick={() => setShowPayForm(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium"><CreditCard className="w-4 h-4"/> Mark as Paid</button>}
        </div>
        {showBillForm && po.status === 'Received' && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-3">Record Supplier Bill</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Bill / DR No. *</label><input value={billNo} onChange={e => setBillNo(e.target.value)} placeholder="e.g. DR-2026-001" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"/></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Amount (â±) *</label><input type="number" value={billAmount} onChange={e => setBillAmount(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 rounded px-3 py-2 text-sm"/></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={billDueDate} onChange={e => setBillDueDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm"/></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => transition('Billed', {bill_no: billNo, bill_amount: parseFloat(billAmount) || grandTotal, bill_due_date: billDueDate || null})} disabled={!billNo || !!saving} className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded text-sm font-medium">{saving === 'Billed' ? 'Savingâ¦' : 'Save Bill'}</button>
              <button onClick={() => setShowBillForm(false)} className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
        {showPayForm && po.status === 'Billed' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-1">Mark as Paid â Collection Receipt</h3>
            <p className="text-xs text-green-700 mb-3">A Collection Receipt (CR) number will be auto-generated.</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Amount Paid (â±)</label><input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={po.bill_amount?.toString() ?? '0'} className="w-full border border-gray-300 rounded px-3 py-2 text-sm"/></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm"><option>Cash</option><option>Check</option><option>Bank Transfer</option></select></div>
              {paymentMethod === 'Check' && <div><label className="block text-xs font-medium text-gray-700 mb-1">Check No.</label><input value={checkNo} onChange={e => setCheckNo(e.target.value)} className="w5-full border border-gray-300 rounded px-3 py-2 text-sm"/></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => transition('Paid', {amount_paid: parseFloat(amountPaid) || po.bill_amount, payment_method: paymentMethod})} disabled={!!saving} className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded text-sm font-medium">{saving === 'Paid' ? 'Savingâ¦' : 'Confirm Payment + Issue CR'}</button>
              <button onClick={() => setShowPayForm(false)} className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
        {po.collection_receipt_no && (
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-800">
            <CreditCard className="w-4 h-4"/> Collection Receipt: <strong>{po.collection_receipt_no}</strong>
            {po.amount_paid && <span> â â±{Number(po.amount_paid).toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>}
            {po.payment_method && <span className="text-green-600">({po.payment_method})</span>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          {label: 'Expected Delivery', value: po.expected_delivery},
          {label: 'Bill No', value: po.bill_no},
          {label: 'Bill Amount', value: po.bill_amount != null ? `â±${Number(po.bill_amount).toLocaleString('en-PH', {minimumFractionDigits: 2})}` : null},
          {label: 'Bill Due', value: po.bill_due_date},
        ].map(({label, value}) => (
          <div key={label} className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm text-gray-800 mt-0.5 font-medium">{value ?? 'â'}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Items ({items.length})</h2>
          <p className="text-sm font-medium text-gray-700">Total: <span className="font-bold text-gray-900">â±{grandTotal.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span></p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-left text-xs font-medium text-gray-500"><tr><th className="px-6 py-3">Product</th><th className="px-6 py-3">Qty Ordered</th><th className="px-6 py-3">Unit Cost</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Batch</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{item.product_name}</td>
                <td className="px-6 py-3 text-gray-700">{item.quantity}</td>
                <td className="px-6 py-3 text-gray-600">â±{Number(item.unit_cost).toLocaleString('en-PH', {minimumFractionDigits: 2})}</td>
                <td className="px-6 py-3 font-medium text-gray-800">â±{Number(item.total_cost).toLocaleString('en-PH', {minimumFractionDigits: 2})}</td>
                <td className="px-6 py-3 text-gray-500">{item.batch_number ?? 'â'}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No items.</td></tr>}
          </tbody>
        </table>
      </div>
      {po.notes && <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4"><p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Notes</p><p className="text-sm text-gray-700">{po.notes}</p></div>}
    </div>
  )
}
