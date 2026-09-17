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
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError("")

        const data = await getDashboard(
          workspace.id
        )

        setDashboard(data)
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError(
            "Gagal mengambil data dashboard"
          )
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

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-6xl px-6 py-8">

          <div className="animate-pulse space-y-6">

            <div>
              <div className="h-4 w-32 rounded bg-gray-200" />

              <div className="mt-3 h-9 w-64 rounded-lg bg-gray-200" />

              <div className="mt-2 h-4 w-80 rounded bg-gray-200" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">

              <div className="h-36 rounded-2xl bg-gray-200" />
              <div className="h-36 rounded-2xl bg-gray-200" />
              <div className="h-36 rounded-2xl bg-gray-200" />

            </div>

            <div className="h-96 rounded-2xl bg-gray-200" />

          </div>

        </div>

      </div>
    )
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-10">

        <div className="mx-auto max-w-6xl">

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                !
              </div>

              <div>

                <h2 className="font-semibold text-red-700">
                  Gagal memuat dashboard
                </h2>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    )
  }

  if (!dashboard) {
    return null
  }

  const recentTransactions =
    dashboard.recent_transactions || []

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Workspace Aktif
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              {workspace.name}
            </h1>

            <p className="mt-2 max-w-xl text-sm text-gray-500">
              {workspace.description ||
                "Kelola keuanganmu dengan lebih teratur."}
            </p>

          </div>
        </div>

        {/* =========================
            SUMMARY CARDS
        ========================= */}

        <div className="grid gap-4 md:grid-cols-3">

          {/* SALDO */}

          <div className="relative overflow-hidden rounded-2xl bg-black p-6 text-white shadow-sm">

            <div className="relative z-10">

              <div className="flex items-center justify-between">

                <p className="text-sm font-medium text-gray-400">
                  Total Saldo
                </p>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm">
                  Rp
                </div>

              </div>

              <p className="mt-5 text-3xl font-bold tracking-tight">
                {formatRupiah(
                  dashboard.summary.balance
                )}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Saldo seluruh akun
              </p>

            </div>

            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />

            <div className="absolute -bottom-16 -right-4 h-40 w-40 rounded-full border border-white/5" />

          </div>

          {/* PEMASUKAN */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-gray-500">
                Total Pemasukan
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700">
                ↑
              </div>

            </div>

            <p className="mt-5 text-2xl font-bold tracking-tight text-gray-900">
              {formatRupiah(
                dashboard.summary.total_income
              )}
            </p>

            <div className="mt-4 flex items-center gap-2">

              <span className="flex h-2 w-2 rounded-full bg-gray-800" />

              <span className="text-xs text-gray-400">
                Total pemasukan
              </span>

            </div>

          </div>

          {/* PENGELUARAN */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm font-medium text-gray-500">
                Total Pengeluaran
              </p>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700">
                ↓
              </div>

            </div>

            <p className="mt-5 text-2xl font-bold tracking-tight text-gray-900">
              {formatRupiah(
                dashboard.summary.total_expense
              )}
            </p>

            <div className="mt-4 flex items-center gap-2">

              <span className="flex h-2 w-2 rounded-full bg-gray-400" />

              <span className="text-xs text-gray-400">
                Total pengeluaran
              </span>

            </div>

          </div>

        </div>

        {/* =========================
            TRANSACTIONS
        ========================= */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* SECTION HEADER */}

          <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="font-bold text-gray-900">
                Transaksi Terbaru
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Aktivitas keuangan terbaru
              </p>

            </div>

            <button
              onClick={
                onViewAllTransactions
              }
              className="text-sm font-semibold text-gray-700 transition hover:text-black"
            >
              Lihat Semua →
            </button>

          </div>

          {/* TRANSACTION LIST */}

          {recentTransactions.length ===
          0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-xl">
                —
              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Belum ada transaksi
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Transaksi terbaru akan muncul
                di sini.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-gray-100">

              {recentTransactions.map(
                (transaction) => {

                  const isIncome =
                    transaction.type ===
                    "income"

                  return (
                    <div
                      key={
                        transaction.id
                      }
                      className="flex flex-col gap-4 px-6 py-5 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                    >

                      {/* LEFT */}

                      <div className="flex items-center gap-4">

                        <div
                          className={
                            isIncome
                              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold text-gray-800"
                              : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold text-gray-500"
                          }
                        >
                          {isIncome
                            ? "↑"
                            : "↓"}
                        </div>

                        <div>

                          <p className="font-semibold text-gray-900">
                            {transaction.category ||
                              "Tanpa kategori"}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-400">

                            <span>
                              {transaction.account ||
                                "Tanpa akun"}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {transaction.notes ||
                                "Tidak ada catatan"}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* RIGHT */}

                      <div className="flex items-center justify-between gap-6 md:justify-end">

                        <p
                          className={
                            isIncome
                              ? "font-bold text-gray-900"
                              : "font-bold text-gray-700"
                          }
                        >
                          {isIncome
                            ? "+"
                            : "-"}
                          {formatRupiah(
                            Math.abs(
                              transaction.amount
                            )
                          )}
                        </p>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </section>

        {/* =========================
            QUICK ACTION
        ========================= */}

        <section className="mt-6 grid gap-4 md:grid-cols-2">

          <button
            onClick={
              onViewAllTransactions
            }
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700">
                  ↗
                </div>

                <div>

                  <p className="font-semibold text-gray-900">
                    Kelola Transaksi
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Lihat dan kelola seluruh
                    transaksi
                  </p>

                </div>

              </div>

              <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-black">
                →
              </span>

            </div>

          </button>

          <button
            onClick={
              onViewSavingsGoals
            }
            className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700">
                  $
                </div>

                <div>

                  <p className="font-semibold text-gray-900">
                    Target Tabungan
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Pantau progres tujuan
                    finansial
                  </p>

                </div>

              </div>

              <span className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-black">
                →
              </span>

            </div>

          </button>

        </section>

      </main>

    </div>
  )
}

export default Dashboard