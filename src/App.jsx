import { useEffect, useMemo, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

function CurrencyInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-cyan-300 mb-1">{label}</label>
      <input
        type="number"
        step="0.01"
        className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-md px-3 py-2 text-cyan-100 placeholder-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value || 0))}
      />
    </div>
  )
}

function NumberInput({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-cyan-300 mb-1">{label}</label>
      <input
        type="number"
        className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-md px-3 py-2 text-cyan-100 placeholder-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value || 0))}
      />
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-cyan-300 mb-1">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-slate-900/60 border border-cyan-500/30 rounded-md px-3 py-2 text-cyan-100 placeholder-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function StatCard({ title, value, accent = 'cyan' }) {
  const accentRing = accent === 'cyan' ? 'ring-cyan-500/50' : 'ring-indigo-500/50'
  const accentText = accent === 'cyan' ? 'text-cyan-300' : 'text-indigo-300'
  return (
    <div className={`bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4 ring-1 ${accentRing}`}>
      <div className={`text-xs uppercase tracking-widest ${accentText}`}>{title}</div>
      <div className="text-2xl font-semibold text-cyan-100 mt-1">{value}</div>
    </div>
  )
}

function InvoiceForm({ onSaved, editing }) {
  const [invoiceNo, setInvoiceNo] = useState(editing?.invoice_no || '')
  const [customer, setCustomer] = useState(editing?.customer || '')
  const [itemName, setItemName] = useState(editing?.item_name || '')
  const [suratJalanNo, setSuratJalanNo] = useState(editing?.surat_jalan_no || '')
  const [quantity, setQuantity] = useState(editing?.quantity || 0)
  const [price, setPrice] = useState(editing?.price || 0)

  const TAX_RATE = 0.11
  const subtotal = useMemo(() => quantity * price, [quantity, price])
  const tax = useMemo(() => parseFloat((subtotal * TAX_RATE).toFixed(2)), [subtotal])
  const total = useMemo(() => parseFloat((subtotal + tax).toFixed(2)), [subtotal, tax])

  async function handleSubmit(e) {
    e.preventDefault()

    const createBody = {
      invoice_no: invoiceNo,
      customer,
      item_name: itemName,
      surat_jalan_no: suratJalanNo,
      quantity,
      price,
    }

    const updateBody = {
      customer,
      item_name: itemName,
      surat_jalan_no: suratJalanNo,
      quantity,
      price,
    }

    const url = editing ? `${BACKEND_URL}/api/invoices/${editing.id}` : `${BACKEND_URL}/api/invoices`
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? updateBody : createBody

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const msg = res.status === 409 ? 'Nomor invoice sudah ada' : 'Gagal menyimpan invoice'
      alert(msg)
      return
    }
    const data = await res.json()
    onSaved && onSaved(data)
    if (!editing) {
      setInvoiceNo('')
      setCustomer('')
      setItemName('')
      setSuratJalanNo('')
      setQuantity(0)
      setPrice(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="No Invoice" value={invoiceNo} onChange={setInvoiceNo} disabled={!!editing} />
        <TextInput label="Customer" value={customer} onChange={setCustomer} />
        <TextInput label="Nama Barang" value={itemName} onChange={setItemName} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextInput label="No Surat Jalan" value={suratJalanNo} onChange={setSuratJalanNo} />
        <NumberInput label="Quantity" value={quantity} onChange={setQuantity} />
        <CurrencyInput label="Harga" value={price} onChange={setPrice} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Subtotal" value={subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} />
        <StatCard title="Tax (11%)" value={tax.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} accent="indigo" />
        <StatCard title="Total" value={total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-md shadow-lg shadow-cyan-500/20 border border-cyan-500/30">
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
    <div className="min-h-screen bg-slate-950 text-cyan-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.15),transparent_40%),_radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.15),transparent_40%),_radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.12),transparent_40%)]" />
        <div className="max-w-6xl mx-auto p-6 relative z-10">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Invoice Penjualan</h1>
              <p className="text-cyan-300/70">Tax 11% otomatis dari Qty x Harga. Data tersimpan dan bisa di-edit.</p>
            </div>
            <button onClick={loadInvoices} className="px-4 py-2 rounded-md border border-cyan-500/30 bg-slate-900/50 hover:bg-slate-900 text-cyan-200">
              Refresh
            </button>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-2xl p-6 shadow-xl shadow-cyan-500/10">
              <h2 className="text-xl font-semibold mb-4 text-cyan-200">Form Invoice</h2>
              <InvoiceForm
                editing={editing}
                onSaved={() => {
                  setEditing(null)
                  loadInvoices()
                }}
              />
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-cyan-500/20 rounded-2xl p-6 shadow-xl shadow-cyan-500/10">
              <h2 className="text-xl font-semibold mb-4 text-cyan-200">Daftar Invoice</h2>
              {loading ? (
                <div>Memuat...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/60 text-cyan-300">
                        <th className="text-left p-2">No Invoice</th>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-left p-2">Nama Barang</th>
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
                        <tr key={inv.id} className="border-b border-cyan-500/10 hover:bg-slate-800/40">
                          <td className="p-2">{inv.invoice_no}</td>
                          <td className="p-2">{inv.customer}</td>
                          <td className="p-2">{inv.item_name}</td>
                          <td className="p-2">{inv.surat_jalan_no}</td>
                          <td className="p-2 text-right">{inv.quantity}</td>
                          <td className="p-2 text-right">{inv.price?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                          <td className="p-2 text-right">{inv.tax?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                          <td className="p-2 text-right">{inv.total?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                          <td className="p-2 text-center">
                            <button
                              className="text-cyan-400 hover:underline"
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
          </section>

          <footer className="mt-10 text-center text-xs text-cyan-400/60">
            Built with a cyber blue theme • Responsif untuk mobile dan desktop
          </footer>
        </div>
      </div>
    </div>
  )
}

export default App
