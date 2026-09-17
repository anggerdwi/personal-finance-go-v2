import { useEffect, useState } from "react"
import { getDashboard } from "../services/api"

type DashboardProps = {
  workspace: {
    id: number
    name: string
    description: string
  }

  onViewAllTransactions: () => void

  onViewSavingsGoals: () => void
}

type DashboardData = {
  summary: {
    balance: number
    total_income: number
    total_expense: number
  }

  recent_transactions: {
    id: number
    type: string
    amount: number
    category: string
    account: string | null
    notes: string
  }[]
}

function Dashboard({
  workspace,
  onViewAllTransactions,
  onViewSavingsGoals,
}: DashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError("")

        const data = await getDashboard(workspace.id)

        console.log("Dashboard berhasil:", data)

        setDashboard(data)
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError("Gagal mengambil data dashboard")
        }
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [workspace.id])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          Memuat dashboard...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-700">
              Gagal memuat dashboard
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-gray-500">
            Workspace aktif
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {workspace.name}
          </h1>

          <p className="mt-2 text-gray-500">
            {workspace.description}
          </p>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Saldo */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Saldo
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {formatRupiah(dashboard.summary.balance)}
            </h2>
          </div>

          {/* Pemasukan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Pemasukan
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {formatRupiah(dashboard.summary.total_income)}
            </h2>
          </div>

          {/* Pengeluaran */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Pengeluaran
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {formatRupiah(dashboard.summary.total_expense)}
            </h2>
          </div>

        </div>
                    {/* Recent Transactions */}
        {/* Recent Transactions */}
<div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">

  {/* Header */}
  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Transaksi Terbaru
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        5 transaksi terakhir
      </p>
    </div>

    <button
      onClick={onViewAllTransactions}
      className="text-sm font-medium text-blue-600 hover:text-blue-700"
    >
      Lihat Semua Transaksi
    </button>

    <button
  onClick={onViewSavingsGoals}
  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
>
  Target Tabungan
</button>
  </div>

  {/* Transaction List */}
  <div className="divide-y divide-gray-100">
    {dashboard.recent_transactions.map((transaction) => (
      <div
        key={transaction.id}
        className="flex items-center justify-between px-6 py-5"
      >

        {/* Kiri */}
        <div>
          <p className="font-medium text-gray-900">
            {transaction.category || "Tanpa kategori"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {transaction.notes || "Tidak ada catatan"}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {transaction.account || "Tanpa akun"}
          </p>
        </div>

        {/* Kanan */}
        <div className="text-right">
          <p
            className={
              transaction.type === "income"
                ? "font-semibold text-green-600"
                : "font-semibold text-red-600"
            }
          >
            {transaction.type === "income" ? "+" : "-"}
            {formatRupiah(Math.abs(transaction.amount))}
          </p>
        </div>

      </div>
    ))}
  </div>

</div> 
      </div>
    </div>
  )
}

export default Dashboard