import { useEffect, useState } from "react"
import { getTransactions } from "../services/api"

type TransactionsProps = {
  workspace: {
    id: number
    name: string
    description: string
  }
  onBack: () => void
}

type Transaction = {
  id: number
  type: string
  amount: number
  notes: string
  category: {
    id: number
    name: string
  } | null
  account: {
    id: number
    name: string
  } | null
}

function Transactions({
  workspace,
  onBack,
}: TransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true)
        setError("")

        const data = await getTransactions(workspace.id)

        console.log("Transactions berhasil:", data)

        setTransactions(data.data || data)
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError("Gagal mengambil transaksi")
        }
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [workspace.id])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">

          <button
            onClick={onBack}
            className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Kembali ke Dashboard
          </button>

          <p className="text-sm text-gray-500">
            Workspace aktif
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Transaksi
          </h1>

          <p className="mt-2 text-gray-500">
            {workspace.name} — Riwayat seluruh transaksi
          </p>

        </div>

        {/* Transaction List */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Title */}
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Semua Transaksi
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Daftar seluruh transaksi workspace {workspace.name}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="border-t border-gray-100 px-6 py-8 text-center">
              <p className="text-sm text-gray-500">
                Memuat transaksi...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-t border-red-100 bg-red-50 px-6 py-8">
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            transactions.length === 0 && (
              <div className="border-t border-gray-100 px-6 py-8 text-center">
                <p className="text-sm text-gray-500">
                  Belum ada transaksi
                </p>
              </div>
            )}

          {/* Transactions */}
          {!loading &&
            !error &&
            transactions.length > 0 && (
              <div className="divide-y divide-gray-100">

                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between px-6 py-5"
                  >

                    {/* Transaction Information */}
                    <div>

                      <p className="font-medium text-gray-900">
                        {transaction.category?.name ||
                          "Tanpa kategori"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {transaction.notes ||
                          "Tidak ada catatan"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {transaction.account?.name ||
                          "Tanpa akun"}
                      </p>

                    </div>

                    {/* Amount */}
                    <div className="text-right">

                      <p
                        className={
                          transaction.type === "income"
                            ? "font-semibold text-green-600"
                            : "font-semibold text-red-600"
                        }
                      >
                        {transaction.type === "income"
                          ? "+"
                          : "-"}

                        {formatRupiah(
                          Math.abs(transaction.amount)
                        )}
                      </p>

                    </div>

                  </div>
                ))}

              </div>
            )}

        </div>

      </div>
    </div>
  )
}

export default Transactions