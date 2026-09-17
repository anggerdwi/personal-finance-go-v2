import { useEffect, useState } from "react"
import {
  getSavingsGoals,
  createSavingsGoal,
  createSavingsDeposit,
  getAccounts,
} from "../services/api"

type SavingsGoalProps = {
  workspace: {
    id: number
    name: string
    description: string
  }
  onBack: () => void
}

type SavingsGoal = {
  id: number
  name: string
  target_amount: number
  current_amount: number
  progress: number
  deadline: string
  frequency: string
}

type Account = {
  id: number
  name: string
  balance: number
}

function SavingsGoal({
  workspace,
  onBack,
}: SavingsGoalProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // =========================
  // CREATE GOAL FORM
  // =========================

  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [deadline, setDeadline] = useState("")
  const [frequency, setFrequency] = useState("monthly")

  const [saving, setSaving] = useState(false)

  // =========================
  // DEPOSIT FORM
  // =========================

  const [depositGoalId, setDepositGoalId] =
    useState<number | null>(null)

  const [depositAccountId, setDepositAccountId] =
    useState("")

  const [depositAmount, setDepositAmount] =
    useState("")

  const [depositNotes, setDepositNotes] =
    useState("")

  const [depositSaving, setDepositSaving] =
    useState(false)

  // =========================
  // FORMAT RUPIAH
  // =========================

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // =========================
  // FORMAT DEADLINE
  // =========================

  const formatDeadline = (deadline: string) => {
    if (!deadline) {
      return "-"
    }

    const date = new Date(deadline)

    if (isNaN(date.getTime())) {
      return deadline
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  // =========================
  // FORMAT FREQUENCY
  // =========================

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Harian"

      case "weekly":
        return "Mingguan"

      case "monthly":
        return "Bulanan"

      default:
        return frequency
    }
  }

  // =========================
  // LOAD GOALS
  // =========================

  const loadGoals = async () => {
    try {
      setLoading(true)
      setError("")

      const data = await getSavingsGoals(
        workspace.id
      )

      setGoals(data.data || [])
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          "Gagal mengambil savings goal"
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // LOAD ACCOUNTS
  // =========================

  const loadAccounts = async () => {
    try {
      const data = await getAccounts(
        workspace.id
      )

      console.log(
        "ACCOUNTS DARI BACKEND:",
        data
      )

      setAccounts(data)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          "Gagal mengambil rekening"
        )
      }
    }
  }

  // =========================
  // LOAD DATA
  // =========================

  const loadData = async () => {
    await Promise.all([
      loadGoals(),
      loadAccounts(),
    ])
  }

  // =========================
  // CREATE GOAL
  // =========================

  const handleCreateGoal = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    setError("")

    if (!name.trim()) {
      setError(
        "Nama target wajib diisi."
      )
      return
    }

    const amount = Number(targetAmount)

    if (
      !targetAmount ||
      isNaN(amount) ||
      amount <= 0
    ) {
      setError(
        "Target nominal harus lebih dari 0."
      )
      return
    }

    if (!deadline) {
      setError(
        "Deadline wajib diisi."
      )
      return
    }

    try {
      setSaving(true)

      await createSavingsGoal(
        workspace.id,
        name.trim(),
        amount,
        deadline,
        frequency
      )

      setName("")
      setTargetAmount("")
      setDeadline("")
      setFrequency("monthly")

      setShowForm(false)

      await loadGoals()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          "Gagal membuat savings goal."
        )
      }
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // OPEN DEPOSIT FORM
  // =========================

  const openDepositForm = (
    goalId: number
  ) => {
    setError("")

    setDepositGoalId(goalId)

    setDepositAccountId(
      accounts.length > 0
        ? String(accounts[0].id)
        : ""
    )

    setDepositAmount("")
    setDepositNotes("")
  }

  // =========================
  // CLOSE DEPOSIT FORM
  // =========================

  const closeDepositForm = () => {
    setDepositGoalId(null)
    setDepositAccountId("")
    setDepositAmount("")
    setDepositNotes("")
  }

  // =========================
  // CREATE DEPOSIT
  // =========================

  const handleCreateDeposit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault()

    setError("")

    if (!depositGoalId) {
      setError(
        "Target tabungan belum dipilih."
      )
      return
    }

    if (!depositAccountId) {
      setError(
        "Pilih rekening terlebih dahulu."
      )
      return
    }

    const amount = Number(depositAmount)

    if (
      !depositAmount ||
      isNaN(amount) ||
      amount <= 0
    ) {
      setError(
        "Nominal dana harus lebih dari 0."
      )
      return
    }

    const selectedAccount =
      accounts.find(
        (account) =>
          account.id ===
          Number(depositAccountId)
      )

    if (
      selectedAccount &&
      amount > selectedAccount.balance
    ) {
      setError(
        "Saldo rekening tidak mencukupi."
      )
      return
    }

    try {
      setDepositSaving(true)

      await createSavingsDeposit(
        depositGoalId,
        Number(depositAccountId),
        amount,
        depositNotes.trim()
      )

      closeDepositForm()

      await loadData()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          "Gagal menambahkan dana."
        )
      }
    } finally {
      setDepositSaving(false)
    }
  }

  // =========================
  // LOAD INITIAL DATA
  // =========================

  useEffect(() => {
    loadData()
  }, [workspace.id])

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-8">

          <button
            onClick={onBack}
            className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Kembali ke Dashboard
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Workspace aktif
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Target Tabungan
              </h1>

              <p className="mt-2 text-gray-500">
                {workspace.name}
              </p>

            </div>

            <button
              onClick={() => {
                setError("")
                setShowForm(!showForm)
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {showForm
                ? "Tutup Form"
                : "+ Tambah Target"}
            </button>

          </div>

        </div>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm text-red-600">
              {error}
            </p>

          </div>
        )}

        {/* =========================
            FORM TARGET
        ========================= */}

        {showForm && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-semibold text-gray-900">
              Tambah Target Tabungan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Buat target tabungan baru.
            </p>

            <form
              onSubmit={handleCreateGoal}
              className="mt-6 space-y-5"
            >

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nama Target
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Beli Laptop"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Target Nominal
                </label>

                <input
                  type="number"
                  min="1"
                  value={targetAmount}
                  onChange={(event) =>
                    setTargetAmount(
                      event.target.value
                    )
                  }
                  placeholder="12000000"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Deadline
                </label>

                <input
                  type="date"
                  value={deadline}
                  onChange={(event) =>
                    setDeadline(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Frekuensi
                </label>

                <select
                  value={frequency}
                  onChange={(event) =>
                    setFrequency(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >

                  <option value="daily">
                    Harian
                  </option>

                  <option value="weekly">
                    Mingguan
                  </option>

                  <option value="monthly">
                    Bulanan
                  </option>

                </select>

              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Menyimpan..."
                    : "Simpan Target"}
                </button>

              </div>

            </form>

          </div>
        )}

        {/* =========================
            LOADING
        ========================= */}

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">

            <p className="text-sm text-gray-500">
              Memuat data...
            </p>

          </div>
        )}

        {/* =========================
            EMPTY
        ========================= */}

        {!loading &&
          !error &&
          goals.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

              <h2 className="text-lg font-semibold text-gray-900">
                Belum ada target tabungan
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Buat target tabungan pertama kamu.
              </p>

            </div>
          )}

        {/* =========================
            GOALS
        ========================= */}

        {!loading &&
          !error &&
          goals.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">

              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >

                  {/* NAME */}

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h2 className="text-lg font-semibold text-gray-900">
                        {goal.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Target{" "}
                        {formatFrequency(
                          goal.frequency
                        )}
                      </p>

                    </div>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      {Math.round(
                        goal.progress
                      )}
                      %
                    </span>

                  </div>

                  {/* AMOUNT */}

                  <div className="mt-6">

                    <div className="flex items-end justify-between">

                      <div>

                        <p className="text-xs text-gray-500">
                          Terkumpul
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {formatRupiah(
                            goal.current_amount
                          )}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-gray-500">
                          Target
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          {formatRupiah(
                            goal.target_amount
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* PROGRESS */}

                  <div className="mt-5">

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              goal.progress,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* FOOTER */}

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">

                    <div>

                      <p className="text-xs text-gray-400">
                        Deadline
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {formatDeadline(
                          goal.deadline
                        )}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-xs text-gray-400">
                        Frekuensi
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {formatFrequency(
                          goal.frequency
                        )}
                      </p>

                    </div>

                  </div>

                  {/* DEPOSIT BUTTON */}

                  <button
                    onClick={() =>
                      openDepositForm(
                        goal.id
                      )
                    }
                    className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + Tambah Dana
                  </button>

                  {/* DEPOSIT FORM */}

                  {depositGoalId ===
                    goal.id && (
                    <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">

                      <h3 className="font-semibold text-gray-900">
                        Tambah Dana
                      </h3>

                      <form
                        onSubmit={
                          handleCreateDeposit
                        }
                        className="mt-4 space-y-4"
                      >

                        {/* ACCOUNT */}

                        <div>

                          <label className="mb-2 block text-xs font-medium text-gray-600">
                            Rekening Sumber Dana
                          </label>

                          <select
                            value={
                              depositAccountId
                            }
                            onChange={(
                              event
                            ) =>
                              setDepositAccountId(
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                          >

                            <option value="">
                              Pilih rekening
                            </option>

                            {accounts.map(
                              (account) => (
                                <option
                                  key={
                                    account.id
                                  }
                                  value={
                                    account.id
                                  }
                                >
                                  {account.name} -{" "}
                                  {formatRupiah(
                                    account.balance
                                  )}
                                </option>
                              )
                            )}

                          </select>

                        </div>

                        {/* AMOUNT */}

                        <div>

                          <label className="mb-2 block text-xs font-medium text-gray-600">
                            Nominal
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              depositAmount
                            }
                            onChange={(
                              event
                            ) =>
                              setDepositAmount(
                                event.target.value
                              )
                            }
                            placeholder="Contoh: 500000"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                          />

                        </div>

                        {/* NOTES */}

                        <div>

                          <label className="mb-2 block text-xs font-medium text-gray-600">
                            Catatan
                          </label>

                          <input
                            type="text"
                            value={
                              depositNotes
                            }
                            onChange={(
                              event
                            ) =>
                              setDepositNotes(
                                event.target.value
                              )
                            }
                            placeholder="Contoh: Tabungan bulan September"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                          />

                        </div>

                        {/* BUTTON */}

                        <div className="flex gap-2">

                          <button
                            type="button"
                            onClick={
                              closeDepositForm
                            }
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
                          >
                            Batal
                          </button>

                          <button
                            type="submit"
                            disabled={
                              depositSaving
                            }
                            className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {depositSaving
                              ? "Menyimpan..."
                              : "Simpan Dana"}
                          </button>

                        </div>

                      </form>

                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

      </div>
    </div>
  )
}

export default SavingsGoal