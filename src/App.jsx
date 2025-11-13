import { useEffect, useMemo, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function CurrencyInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        step="0.01"
        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value || 0))}
      />
    </div>
  )
}

function NumberInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || 0))}
      />
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function InvoiceForm({ onSaved, editing }) {
  const [customerInvoiceNo, setCustomerInvoiceNo] = useState(editing?.customer_invoice_no || '')
  const [suratJalanNo, setSuratJalanNo] = useState(editing?.surat_jalan_no || '')
  const [quantity, setQuantity] = useState(editing?.quantity || 0)
  const [price, setPrice] = useState(editing?.price || 0)

  const TAX_RATE = 0.11
  const subtotal = useMemo(() => quantity * price, [quantity, price])
  const tax = useMemo(() => parseFloat((subtotal * TAX_RATE).toFixed(2)), [subtotal])
  const total = useMemo(() => parseFloat((subtotal + tax).toFixed(2)), [subtotal, tax])

  async function handleSubmit(e) {
    e.preventDefault()
    const body = {
      customer_invoice_no: customerInvoiceNo,
      surat_jalan_no: suratJalanNo,
      quantity,
      price,
    }

    const url = editing ? `${BACKEND_URL}/api/invoices/${editing.id}` : `${BACKEND_URL}/api/invoices`
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      alert('Gagal menyimpan invoice')
      return
    }
    const data = await res.json()
    onSaved && onSaved(data)
    if (!editing) {
      setCustomerInvoiceNo('')
      setSuratJalanNo('')
      setQuantity(0)
      setPrice(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput label="No Customer Invoice" value={customerInvoiceNo} onChange={setCustomerInvoiceNo} placeholder="INV-001" />
        <TextInput label="No Surat Jalan" value={suratJalanNo} onChange={setSuratJalanNo} placeholder="SJ-001" />
        <NumberInput label="Quantity" value={quantity} onChange={setQuantity} />
        <CurrencyInput label="Harga" value={price} onChange={setPrice} />
      </div>

      <div className="bg-gray-50 rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-500">Subtotal</div>
          <div className="text-lg font-semibold">{subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Tax (11%)</div>
          <div className="text-lg font-semibold">{tax.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-lg font-semibold">{total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
          {editing ? 'Update' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}

function App() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  async function loadInvoices() {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/invoices`)
      const data = await res.json()
      setInvoices(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Pencatatan Invoice Penjualan</h1>
          <p className="text-gray-600 mb-4">Masukkan data. Tax 11% otomatis dihitung dari harga x qty.</p>
          <InvoiceForm
            editing={editing}
            onSaved={() => {
              setEditing(null)
              loadInvoices()
            }}
          />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Daftar Invoice</h2>
            <button className="text-sm text-blue-600" onClick={loadInvoices}>Refresh</button>
          </div>
          {loading ? (
            <div>Memuat...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">No Customer Invoice</th>
                    <th className="text-left p-2">No Surat Jalan</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Harga</th>
                    <th className="text-right p-2">Tax (11%)</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-center p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-2">{inv.customer_invoice_no}</td>
                      <td className="p-2">{inv.surat_jalan_no}</td>
                      <td className="p-2 text-right">{inv.quantity}</td>
                      <td className="p-2 text-right">{inv.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                      <td className="p-2 text-right">{inv.tax?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                      <td className="p-2 text-right">{inv.total?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                      <td className="p-2 text-center">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => setEditing(inv)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
