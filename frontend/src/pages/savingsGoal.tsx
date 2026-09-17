import { useEffect, useState } from "react"
import {
  getSavingsGoals,
  createSavingsGoal,
  getSavingsDeposits,
  createSavingsDeposit,
  updateSavingsDeposit,
  deleteSavingsDeposit,
  getAccounts,
} from "../services/api"

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

type Deposit = {
  id: number
  account_id: number
  amount: number
  notes: string
  created_at: string
}

type Props = {
  workspace: {
    id: number
    name: string
  }
  onBack: () => void
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (date: string) => {
  if (!date) return "-"

  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function SavingsGoal({
  workspace,
  onBack,
}: Props) {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [deposits, setDeposits] = useState<
    Record<number, Deposit[]>
  >({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // =========================
  // MODAL
  // =========================
  const [modal, setModal] = useState<
    "goal" | "deposit" | "editDeposit" | null
  >(null)

  // =========================
  // GOAL FORM
  // =========================
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
  // EDIT DEPOSIT
  // =========================
  const [editingDepositId, setEditingDepositId] =
    useState<number | null>(null)

  const [editDepositGoalId, setEditDepositGoalId] =
    useState<number | null>(null)

  const [editDepositAccountId, setEditDepositAccountId] =
    useState("")

  const [editDepositAmount, setEditDepositAmount] =
    useState("")

  const [editDepositNotes, setEditDepositNotes] =
    useState("")

  const [editDepositSaving, setEditDepositSaving] =
    useState(false)

  // =========================
  // LOAD
  // =========================
  const loadGoals = async () => {
    const data = await getSavingsGoals(workspace.id)
    const list = data.data || []

    setGoals(list)

    return list
  }

  const loadAccounts = async () => {
    const data = await getAccounts(workspace.id)
    setAccounts(data)
  }

  const loadDeposits = async (goalList: SavingsGoal[]) => {
    const result: Record<number, Deposit[]> = {}

    await Promise.all(
      goalList.map(async (goal) => {
        try {
          const data = await getSavingsDeposits(goal.id)
          result[goal.id] = data.data || []
        } catch {
          result[goal.id] = []
        }
      })
    )

    setDeposits(result)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      const goalList = await loadGoals()

      await Promise.all([
        loadAccounts(),
        loadDeposits(goalList),
      ])
    } catch (err: any) {
      setError(
        err.message || "Gagal memuat data tabungan"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [workspace.id])

  // =========================
  // CLOSE MODAL
  // =========================
  const closeModal = () => {
    setModal(null)

    setName("")
    setTargetAmount("")
    setDeadline("")
    setFrequency("monthly")

    setDepositGoalId(null)
    setDepositAccountId("")
    setDepositAmount("")
    setDepositNotes("")

    setEditingDepositId(null)
    setEditDepositGoalId(null)
    setEditDepositAccountId("")
    setEditDepositAmount("")
    setEditDepositNotes("")

    setError("")
  }

  // =========================
  // CREATE GOAL
  // =========================
  const handleCreateGoal = async () => {
    const amount = Number(targetAmount)

    if (!name.trim()) {
      setError("Nama target wajib diisi")
      return
    }

    if (!amount || amount <= 0) {
      setError("Target nominal harus lebih dari 0")
      return
    }

    try {
      setSaving(true)
      setError("")

      await createSavingsGoal(
        workspace.id,
        name.trim(),
        amount,
        deadline,
        frequency
      )

      closeModal()
      await loadData()
    } catch (err: any) {
      setError(
        err.message || "Gagal membuat target tabungan"
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // OPEN DEPOSIT
  // =========================
  const openDepositForm = (goalId: number) => {
    setError("")

    setDepositGoalId(goalId)

    setDepositAccountId(
      accounts.length > 0
        ? String(accounts[0].id)
        : ""
    )

    setDepositAmount("")
    setDepositNotes("")

    setModal("deposit")
  }

  // =========================
  // CREATE DEPOSIT
  // =========================
  const handleCreateDeposit = async () => {
    if (!depositGoalId) {
      setError("Target tidak ditemukan")
      return
    }

    const accountId = Number(depositAccountId)
    const amount = Number(depositAmount)

    if (!accountId) {
      setError("Pilih akun sumber dana")
      return
    }

    if (!amount || amount <= 0) {
      setError("Nominal harus lebih dari 0")
      return
    }

    const account = accounts.find(
      (item) => item.id === accountId
    )

    if (!account) {
      setError("Akun tidak ditemukan")
      return
    }

    if (amount > account.balance) {
      setError(
        `Saldo ${account.name} tidak mencukupi`
      )
      return
    }

    try {
      setDepositSaving(true)
      setError("")

      await createSavingsDeposit(
        depositGoalId,
        accountId,
        amount,
        depositNotes
      )

      closeModal()
      await loadData()
    } catch (err: any) {
      setError(
        err.message || "Gagal menambahkan dana"
      )
    } finally {
      setDepositSaving(false)
    }
  }

  // =========================
  // OPEN EDIT
  // =========================
  const openEditDepositForm = (
    goalId: number,
    deposit: Deposit
  ) => {
    setError("")

    setEditingDepositId(deposit.id)
    setEditDepositGoalId(goalId)

    setEditDepositAccountId(
      String(deposit.account_id)
    )

    setEditDepositAmount(
      String(deposit.amount)
    )

    setEditDepositNotes(
      deposit.notes || ""
    )

    setModal("editDeposit")
  }

  // =========================
  // UPDATE DEPOSIT
  // =========================
  const handleUpdateDeposit = async () => {
    if (
      !editingDepositId ||
      !editDepositGoalId
    ) {
      return
    }

    const accountId = Number(
      editDepositAccountId
    )

    const amount = Number(
      editDepositAmount
    )

    if (!accountId) {
      setError("Pilih akun sumber dana")
      return
    }

    if (!amount || amount <= 0) {
      setError("Nominal harus lebih dari 0")
      return
    }

    try {
      setEditDepositSaving(true)
      setError("")

      await updateSavingsDeposit(
        editDepositGoalId,
        editingDepositId,
        accountId,
        amount,
        editDepositNotes
      )

      closeModal()
      await loadData()
    } catch (err: any) {
      setError(
        err.message ||
          "Gagal mengubah dana tabungan"
      )
    } finally {
      setEditDepositSaving(false)
    }
  }

  // =========================
  // DELETE
  // =========================
  const handleDeleteDeposit = async (
    goalId: number,
    depositId: number
  ) => {
    const confirmed = window.confirm(
      "Hapus dana tabungan ini?"
    )

    if (!confirmed) return

    try {
      setError("")

      await deleteSavingsDeposit(
        goalId,
        depositId
      )

      await loadData()
    } catch (err: any) {
      setError(
        err.message ||
          "Gagal menghapus dana tabungan"
      )
    }
  }

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-56 rounded-lg bg-gray-200" />
            <div className="h-36 rounded-2xl bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    )
  }

  // =========================
  // TOTAL
  // =========================
  const totalSaved = goals.reduce(
    (sum, goal) =>
      sum + Number(goal.current_amount || 0),
    0
  )

  const totalTarget = goals.reduce(
    (sum, goal) =>
      sum + Number(goal.target_amount || 0),
    0
  )

  const overallProgress =
    totalTarget > 0
      ? Math.min(
          (totalSaved / totalTarget) * 100,
          100
        )
      : 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =========================
          TOP BAR
      ========================= */}
      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-4">

            <button
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-black"
            >
              ←
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Workspace
              </p>

              <h1 className="text-xl font-bold text-gray-900">
                {workspace.name}
              </h1>
            </div>

          </div>

          <button
            onClick={() => {
              setError("")
              setModal("goal")
            }}
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            + Target Baru
          </button>

        </div>

      </header>

      {/* =========================
          MAIN
      ========================= */}
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {/* =========================
            PAGE TITLE
        ========================= */}
        <div>
          <p className="text-sm font-medium text-gray-500">
            Financial Planning
          </p>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Target Tabungan
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Pantau perkembangan tabungan dan
            capai target finansialmu.
          </p>
        </div>

        {/* =========================
            SUMMARY
        ========================= */}
        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Total Terkumpul
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatRupiah(totalSaved)}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Dari seluruh target
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-gray-500">
              Total Target
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatRupiah(totalTarget)}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Target keseluruhan
            </p>

          </div>

          <div className="rounded-2xl border border-gray-200 bg-black p-5 text-white shadow-sm">

            <p className="text-sm text-gray-400">
              Progress Keseluruhan
            </p>

            <p className="mt-2 text-2xl font-bold">
              {overallProgress.toFixed(1)}%
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">

              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${overallProgress}%`,
                }}
              />

            </div>

          </div>

        </div>

        {/* =========================
            GOALS
        ========================= */}
        {goals.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              $
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Belum ada target
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              Buat target tabungan pertama untuk
              mulai mengatur tujuan finansialmu.
            </p>

            <button
              onClick={() => setModal("goal")}
              className="mt-5 rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white"
            >
              Buat Target
            </button>

          </div>

        ) : (

          <div className="space-y-5">

            {goals.map((goal) => {

              const goalDeposits =
                deposits[goal.id] || []

              const remaining = Math.max(
                Number(goal.target_amount) -
                  Number(goal.current_amount),
                0
              )

              return (
                <section
                  key={goal.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >

                  {/* GOAL HEADER */}
                  <div className="flex flex-col gap-4 border-b border-gray-100 p-6 md:flex-row md:items-center md:justify-between">

                    <div>

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 font-bold text-gray-700">
                          $
                        </div>

                        <div>
                          <h3 className="font-bold text-gray-900">
                            {goal.name}
                          </h3>

                          <p className="text-xs text-gray-500">
                            Deadline{" "}
                            {formatDate(
                              goal.deadline
                            )}
                          </p>
                        </div>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        openDepositForm(
                          goal.id
                        )
                      }
                      className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      + Tambah Dana
                    </button>

                  </div>

                  {/* GOAL BODY */}
                  <div className="p-6">

                    <div className="grid gap-6 md:grid-cols-3">

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                          Terkumpul
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {formatRupiah(
                            goal.current_amount
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                          Target
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {formatRupiah(
                            goal.target_amount
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                          Sisa
                        </p>

                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {formatRupiah(
                            remaining
                          )}
                        </p>
                      </div>

                    </div>

                    {/* PROGRESS */}
                    <div className="mt-7">

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-xs font-medium text-gray-500">
                          Progress
                        </span>

                        <span className="text-sm font-bold text-gray-900">
                          {Number(
                            goal.progress || 0
                          ).toFixed(1)}
                          %
                        </span>

                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-black transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              Number(
                                goal.progress || 0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* HISTORY */}
                    <div className="mt-8">

                      <div className="mb-4 flex items-center justify-between">

                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Riwayat Dana
                          </h4>

                          <p className="text-xs text-gray-400">
                            {goalDeposits.length} transaksi
                          </p>
                        </div>

                      </div>

                      {goalDeposits.length === 0 ? (

                        <div className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                          Belum ada dana yang
                          ditambahkan.
                        </div>

                      ) : (

                        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">

                          {goalDeposits.map(
                            (deposit) => {

                              const account =
                                accounts.find(
                                  (item) =>
                                    item.id ===
                                    deposit.account_id
                                )

                              return (
                                <div
                                  key={
                                    deposit.id
                                  }
                                  className="flex flex-col gap-4 p-4 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                                >

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                                      +
                                    </div>

                                    <div>

                                      <p className="font-semibold text-gray-900">
                                        Dana
                                        Tabungan
                                      </p>

                                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-400">

                                        <span>
                                          {account?.name ||
                                            "Akun tidak ditemukan"}
                                        </span>

                                        <span>
                                          •
                                        </span>

                                        <span>
                                          {formatDate(
                                            deposit.created_at
                                          )}
                                        </span>

                                      </div>

                                      {deposit.notes && (
                                        <p className="mt-1 text-xs text-gray-500">
                                          {
                                            deposit.notes
                                          }
                                        </p>
                                      )}

                                    </div>

                                  </div>

                                  <div className="flex items-center justify-between gap-4 md:justify-end">

                                    <p className="font-bold text-gray-900">
                                      +
                                      {formatRupiah(
                                        deposit.amount
                                      )}
                                    </p>

                                    <div className="flex gap-2">

                                      <button
                                        onClick={() =>
                                          openEditDepositForm(
                                            goal.id,
                                            deposit
                                          )
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        onClick={() =>
                                          handleDeleteDeposit(
                                            goal.id,
                                            deposit.id
                                          )
                                        }
                                        className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                      >
                                        Hapus
                                      </button>

                                    </div>

                                  </div>

                                </div>
                              )
                            }
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                </section>
              )
            })}

          </div>

        )}

      </main>

      {/* =========================
          MODAL
      ========================= */}
      {modal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <h3 className="text-lg font-bold text-gray-900">

                  {modal === "goal" &&
                    "Buat Target Baru"}

                  {modal === "deposit" &&
                    "Tambah Dana"}

                  {modal === "editDeposit" &&
                    "Edit Dana"}

                </h3>

                <p className="mt-0.5 text-xs text-gray-400">
                  Lengkapi informasi di bawah.
                </p>

              </div>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
              >
                ×
              </button>

            </div>

            {/* MODAL ERROR */}
            {error && (
              <div className="mx-6 mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* =========================
                GOAL FORM
            ========================= */}
            {modal === "goal" && (

              <div className="space-y-5 p-6">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nama Target
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Contoh: Beli Laptop"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Target Nominal
                  </label>

                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) =>
                      setTargetAmount(
                        e.target.value
                      )
                    }
                    placeholder="10000000"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Deadline
                    </label>

                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) =>
                        setDeadline(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Frekuensi
                    </label>

                    <select
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
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

                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                  >
                    Batal
                  </button>

                  <button
                    onClick={
                      handleCreateGoal
                    }
                    disabled={saving}
                    className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving
                      ? "Menyimpan..."
                      : "Buat Target"}
                  </button>

                </div>

              </div>
            )}

            {/* =========================
                CREATE DEPOSIT
            ========================= */}
            {modal === "deposit" && (

              <div className="space-y-5 p-6">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Akun Sumber Dana
                  </label>

                  <select
                    value={
                      depositAccountId
                    }
                    onChange={(e) =>
                      setDepositAccountId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  >
                    <option value="">
                      Pilih akun
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
                          {account.name} —{" "}
                          {formatRupiah(
                            account.balance
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nominal
                  </label>

                  <input
                    type="number"
                    value={
                      depositAmount
                    }
                    onChange={(e) =>
                      setDepositAmount(
                        e.target.value
                      )
                    }
                    placeholder="500000"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Catatan
                  </label>

                  <input
                    type="text"
                    value={
                      depositNotes
                    }
                    onChange={(e) =>
                      setDepositNotes(
                        e.target.value
                      )
                    }
                    placeholder="Tabungan bulan ini"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                  >
                    Batal
                  </button>

                  <button
                    onClick={
                      handleCreateDeposit
                    }
                    disabled={
                      depositSaving
                    }
                    className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {depositSaving
                      ? "Menyimpan..."
                      : "Tambah Dana"}
                  </button>

                </div>

              </div>
            )}

            {/* =========================
                EDIT DEPOSIT
            ========================= */}
            {modal === "editDeposit" && (

              <div className="space-y-5 p-6">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Akun Sumber Dana
                  </label>

                  <select
                    value={
                      editDepositAccountId
                    }
                    onChange={(e) =>
                      setEditDepositAccountId(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  >
                    <option value="">
                      Pilih akun
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
                          {account.name} —{" "}
                          {formatRupiah(
                            account.balance
                          )}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nominal
                  </label>

                  <input
                    type="number"
                    value={
                      editDepositAmount
                    }
                    onChange={(e) =>
                      setEditDepositAmount(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Catatan
                  </label>

                  <input
                    type="text"
                    value={
                      editDepositNotes
                    }
                    onChange={(e) =>
                      setEditDepositNotes(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-black"
                  />
                </div>

                <div className="flex gap-3 pt-2">

                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                  >
                    Batal
                  </button>

                  <button
                    onClick={
                      handleUpdateDeposit
                    }
                    disabled={
                      editDepositSaving
                    }
                    className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {editDepositSaving
                      ? "Menyimpan..."
                      : "Simpan Perubahan"}
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  )
}