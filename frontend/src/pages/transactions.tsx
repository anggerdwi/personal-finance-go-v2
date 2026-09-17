import { useEffect, useState } from "react"
import {
  getTransactions,
  getCategories,
  getAccounts,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/api"

type TransactionsProps = {
  workspace: {
    id: number
    name: string
    description: string
  }
  onBack: () => void
}

type Transaction = {
  ID?: number
  id?: number
  type: string
  amount: number
  notes: string
  category: {
    ID?: number
    id?: number
    name: string
  } | null
  account: {
    ID?: number
    id?: number
    name: string
  } | null
}

type Category = {
  ID: number
  name: string
}

type Account = {
  ID: number
  name: string
}

function Transactions({
  workspace,
  onBack,
}: TransactionsProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [page, setPage] =
    useState(1)

  const [limit] =
    useState(10)

  const [hasNextPage, setHasNextPage] =
    useState(false)

  const [search, setSearch] =
    useState("")

  const [type, setType] =
    useState("")

  const [categoryId, setCategoryId] =
    useState("")

  const [accountId, setAccountId] =
    useState("")

  const [categories, setCategories] =
    useState<Category[]>([])

  const [accounts, setAccounts] =
    useState<Account[]>([])

  // =========================
  // FORM
  // =========================

  const [showForm, setShowForm] =
    useState(false)

  const [formType, setFormType] =
    useState("expense")

  const [formAmount, setFormAmount] =
    useState("")

  const [formCategoryId, setFormCategoryId] =
    useState("")

  const [formAccountId, setFormAccountId] =
    useState("")

  const [formNotes, setFormNotes] =
    useState("")

  const [saving, setSaving] =
    useState(false)

  const [formError, setFormError] =
    useState("")

  const [
    editingTransactionId,
    setEditingTransactionId,
  ] = useState<number | null>(null)

  // =========================
  // LOAD TRANSACTIONS
  // =========================

  const loadTransactions = async (
    requestedPage = page
  ) => {
    try {
      setLoading(true)
      setError("")

      const data =
        await getTransactions(
          workspace.id,
          requestedPage,
          limit,
          search,
          type,
          categoryId,
          accountId
        )

      const transactionData =
        data.data || data

      setTransactions(
        transactionData
      )

      setHasNextPage(
        transactionData.length ===
          limit
      )
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError(
          "Gagal mengambil transaksi"
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [
    workspace.id,
    page,
    limit,
    search,
    type,
    categoryId,
    accountId,
  ])

  // =========================
  // LOAD FILTER DATA
  // =========================

  useEffect(() => {
    async function loadFilters() {
      try {
        const [
          categoryData,
          accountData,
        ] = await Promise.all([
          getCategories(
            workspace.id
          ),
          getAccounts(
            workspace.id
          ),
        ])

        setCategories(
          categoryData
        )

        setAccounts(
          accountData
        )
      } catch (error) {
        console.error(
          "Gagal mengambil data filter:",
          error
        )
      }
    }

    loadFilters()
  }, [workspace.id])

  // =========================
  // FORMAT RUPIAH
  // =========================

  const formatRupiah = (
    amount: number
  ) => {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(amount)
  }

  // =========================
  // FILTER
  // =========================

  const handleSearch = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(
      event.target.value
    )

    setPage(1)
  }

  const handleTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setType(
      event.target.value
    )

    setPage(1)
  }

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCategoryId(
      event.target.value
    )

    setPage(1)
  }

  const handleAccountChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setAccountId(
      event.target.value
    )

    setPage(1)
  }

  const handleResetFilter = () => {
    setSearch("")
    setType("")
    setCategoryId("")
    setAccountId("")
    setPage(1)
  }

  // =========================
  // OPEN ADD FORM
  // =========================

  const handleOpenForm = () => {
    setEditingTransactionId(
      null
    )

    setFormError("")

    setFormType("expense")
    setFormAmount("")
    setFormCategoryId("")
    setFormAccountId("")
    setFormNotes("")

    setShowForm(true)
  }

  // =========================
  // OPEN EDIT FORM
  // =========================

  const handleEditTransaction = (
    transaction: Transaction
  ) => {
    const transactionId =
      transaction.ID ??
      transaction.id

    if (
      transactionId === undefined
    ) {
      setError(
        "ID transaksi tidak ditemukan."
      )
      return
    }

    setEditingTransactionId(
      transactionId
    )

    setFormType(
      transaction.type
    )

    setFormAmount(
      Math.abs(
        transaction.amount
      ).toString()
    )

    const categoryValue =
      transaction.category?.ID ??
      transaction.category?.id

    const accountValue =
      transaction.account?.ID ??
      transaction.account?.id

    setFormCategoryId(
      categoryValue !==
        undefined
        ? categoryValue.toString()
        : ""
    )

    setFormAccountId(
      accountValue !==
        undefined
        ? accountValue.toString()
        : ""
    )

    setFormNotes(
      transaction.notes || ""
    )

    setFormError("")
    setShowForm(true)
  }

  // =========================
  // DELETE
  // =========================

  const handleDeleteTransaction =
    async (
      transactionId: number
    ) => {
      if (!transactionId) {
        setError(
          "ID transaksi tidak ditemukan."
        )
        return
      }

      const confirmed =
        window.confirm(
          "Yakin ingin menghapus transaksi ini?"
        )

      if (!confirmed) {
        return
      }

      try {
        setError("")

        await deleteTransaction(
          transactionId,
          workspace.id
        )

        if (
          transactions.length ===
            1 &&
          page > 1
        ) {
          setPage(
            (currentPage) =>
              currentPage - 1
          )
        } else {
          await loadTransactions(
            page
          )
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError(
            "Gagal menghapus transaksi"
          )
        }
      }
    }

  // =========================
  // CLOSE FORM
  // =========================

  const handleCloseForm = () => {
    if (saving) {
      return
    }

    setShowForm(false)
    setEditingTransactionId(
      null
    )
    setFormError("")
  }

  // =========================
  // SUBMIT
  // =========================

  const handleSubmitTransaction =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault()

      setFormError("")

      const amount =
        Number(formAmount)

      if (
        !formAmount ||
        amount <= 0
      ) {
        setFormError(
          "Nominal transaksi harus lebih dari 0."
        )
        return
      }

      if (!formCategoryId) {
        setFormError(
          "Silakan pilih kategori."
        )
        return
      }

      if (!formAccountId) {
        setFormError(
          "Silakan pilih akun."
        )
        return
      }

      try {
        setSaving(true)

        let data

        if (
          editingTransactionId !==
          null
        ) {
          data =
            await updateTransaction(
              editingTransactionId,
              workspace.id,
              formType,
              amount,
              Number(
                formCategoryId
              ),
              Number(
                formAccountId
              ),
              formNotes
            )
        } else {
          data =
            await createTransaction(
              workspace.id,
              formType,
              amount,
              Number(
                formCategoryId
              ),
              Number(
                formAccountId
              ),
              formNotes
            )
        }

        console.log(
          "Transaksi berhasil disimpan:",
          data
        )

        setShowForm(false)

        setEditingTransactionId(
          null
        )

        setFormType("expense")
        setFormAmount("")
        setFormCategoryId("")
        setFormAccountId("")
        setFormNotes("")
        setFormError("")

        setPage(1)

        const refreshedData =
          await getTransactions(
            workspace.id,
            1,
            limit,
            search,
            type,
            categoryId,
            accountId
          )

        const transactionData =
          refreshedData.data ||
          refreshedData

        setTransactions(
          transactionData
        )

        setHasNextPage(
          transactionData.length ===
            limit
        )
      } catch (error) {
        if (error instanceof Error) {
          setFormError(
            error.message
          )
        } else {
          setFormError(
            "Gagal menyimpan transaksi."
          )
        }
      } finally {
        setSaving(false)
      }
    }

  // =========================
  // RENDER
  // =========================

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>

            <button
              onClick={onBack}
              className="mb-5 text-sm font-medium text-gray-500 transition hover:text-black"
            >
              ← Kembali ke Dashboard
            </button>

            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Riwayat Keuangan
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Transaksi
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Kelola seluruh transaksi
              dari workspace{" "}
              <span className="font-medium text-gray-700">
                {workspace.name}
              </span>
            </p>

          </div>

          <button
            onClick={handleOpenForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            <span className="text-lg leading-none">
              +
            </span>

            Tambah Transaksi
          </button>

        </div>

        {/* =========================
            MAIN CARD
        ========================= */}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* =========================
              CARD HEADER
          ========================= */}

          <div className="border-b border-gray-100 px-6 py-5">

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="font-bold text-gray-900">
                  Semua Transaksi
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  Riwayat pemasukan dan
                  pengeluaran
                </p>

              </div>

              <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                Halaman {page}
              </div>

            </div>

          </div>

          {/* =========================
              FILTER
          ========================= */}

          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-5">

            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Cari transaksi atau catatan..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />

            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">

              <select
                value={type}
                onChange={
                  handleTypeChange
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              >
                <option value="">
                  Semua Transaksi
                </option>

                <option value="income">
                  Pemasukan
                </option>

                <option value="expense">
                  Pengeluaran
                </option>
              </select>

              <select
                value={categoryId}
                onChange={
                  handleCategoryChange
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              >
                <option value="">
                  Semua Kategori
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.ID}
                      value={category.ID}
                    >
                      {category.name}
                    </option>
                  )
                )}
              </select>

              <select
                value={accountId}
                onChange={
                  handleAccountChange
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              >
                <option value="">
                  Semua Akun
                </option>

                {accounts.map(
                  (account) => (
                    <option
                      key={account.ID}
                      value={account.ID}
                    >
                      {account.name}
                    </option>
                  )
                )}
              </select>

            </div>

            {(search ||
              type ||
              categoryId ||
              accountId) && (
              <button
                onClick={
                  handleResetFilter
                }
                className="mt-4 text-xs font-semibold text-gray-500 transition hover:text-black"
              >
                × Reset semua filter
              </button>
            )}

          </div>

          {/* =========================
              FORM MODAL
          ========================= */}

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">

              <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

                {/* MODAL HEADER */}

                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Transaksi
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-gray-900">
                      {editingTransactionId !==
                      null
                        ? "Edit Transaksi"
                        : "Tambah Transaksi"}
                    </h2>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleCloseForm
                    }
                    disabled={saving}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
                  >
                    ×
                  </button>

                </div>

                {/* FORM */}

                <form
                  onSubmit={
                    handleSubmitTransaction
                  }
                  className="space-y-5 px-6 py-6"
                >

                  {/* ERROR */}

                  {formError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                      <p className="text-sm text-red-600">
                        {formError}
                      </p>

                    </div>
                  )}

                  {/* TYPE */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Jenis Transaksi
                    </label>

                    <div className="grid grid-cols-2 gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          setFormType(
                            "expense"
                          )
                        }
                        className={
                          formType ===
                          "expense"
                            ? "rounded-xl border border-black bg-black px-4 py-3 text-sm font-semibold text-white"
                            : "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        }
                      >
                        ↓ Pengeluaran
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormType(
                            "income"
                          )
                        }
                        className={
                          formType ===
                          "income"
                            ? "rounded-xl border border-black bg-black px-4 py-3 text-sm font-semibold text-white"
                            : "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        }
                      >
                        ↑ Pemasukan
                      </button>

                    </div>

                  </div>

                  {/* AMOUNT */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Nominal
                    </label>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                        Rp
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          formAmount
                        }
                        onChange={(
                          event
                        ) =>
                          setFormAmount(
                            event.target
                              .value
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      />

                    </div>

                  </div>

                  {/* CATEGORY */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Kategori
                    </label>

                    <select
                      value={
                        formCategoryId
                      }
                      onChange={(
                        event
                      ) =>
                        setFormCategoryId(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    >

                      <option value="">
                        Pilih kategori
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={
                              category.ID
                            }
                            value={
                              category.ID
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* ACCOUNT */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Akun
                    </label>

                    <select
                      value={
                        formAccountId
                      }
                      onChange={(
                        event
                      ) =>
                        setFormAccountId(
                          event.target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    >

                      <option value="">
                        Pilih akun
                      </option>

                      {accounts.map(
                        (account) => (
                          <option
                            key={
                              account.ID
                            }
                            value={
                              account.ID
                            }
                          >
                            {
                              account.name
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* NOTES */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Catatan
                    </label>

                    <textarea
                      value={
                        formNotes
                      }
                      onChange={(
                        event
                      ) =>
                        setFormNotes(
                          event.target
                            .value
                        )
                      }
                      placeholder="Tambahkan catatan..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                  </div>

                  {/* ACTION */}

                  <div className="flex gap-3 border-t border-gray-100 pt-5">

                    <button
                      type="button"
                      onClick={
                        handleCloseForm
                      }
                      disabled={
                        saving
                      }
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving
                      }
                      className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Menyimpan..."
                        : editingTransactionId !==
                            null
                          ? "Simpan Perubahan"
                          : "Simpan Transaksi"}
                    </button>

                  </div>

                </form>

              </div>

            </div>
          )}

          {/* =========================
              LOADING
          ========================= */}

          {loading && (
            <div className="divide-y divide-gray-100">

              {Array.from({
                length: 5,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="animate-pulse px-6 py-5"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-4">

                        <div className="h-11 w-11 rounded-xl bg-gray-200" />

                        <div>

                          <div className="h-4 w-32 rounded bg-gray-200" />

                          <div className="mt-2 h-3 w-48 rounded bg-gray-200" />

                        </div>

                      </div>

                      <div className="h-4 w-28 rounded bg-gray-200" />

                    </div>

                  </div>
                )
              )}

            </div>
          )}

          {/* =========================
              ERROR
          ========================= */}

          {!loading && error && (
            <div className="px-6 py-8">

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                    !
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-red-700">
                      Gagal memuat transaksi
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      {error}
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =========================
              EMPTY
          ========================= */}

          {!loading &&
            !error &&
            transactions.length ===
              0 && (
              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-xl text-gray-500">
                  —
                </div>

                <h3 className="mt-4 font-semibold text-gray-900">
                  {search ||
                  type ||
                  categoryId ||
                  accountId
                    ? "Transaksi tidak ditemukan"
                    : "Belum ada transaksi"}
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm text-gray-400">
                  {search ||
                  type ||
                  categoryId ||
                  accountId
                    ? "Coba ubah kata pencarian atau filter yang digunakan."
                    : "Transaksi yang kamu tambahkan akan muncul di sini."}
                </p>

                {!(
                  search ||
                  type ||
                  categoryId ||
                  accountId
                ) && (
                  <button
                    onClick={
                      handleOpenForm
                    }
                    className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    + Tambah Transaksi
                  </button>
                )}

              </div>
            )}

          {/* =========================
              TRANSACTIONS
          ========================= */}

          {!loading &&
            !error &&
            transactions.length >
              0 && (
              <div className="divide-y divide-gray-100">

                {transactions.map(
                  (
                    transaction
                  ) => {

                    const transactionId =
                      transaction.ID ??
                      transaction.id

                    const isIncome =
                      transaction.type ===
                      "income"

                    return (
                      <div
                        key={
                          transactionId
                        }
                        className="group px-6 py-5 transition hover:bg-gray-50"
                      >

                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                          {/* LEFT */}

                          <div className="flex min-w-0 items-center gap-4">

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

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-semibold text-gray-900">
                                  {transaction
                                    .category
                                    ?.name ||
                                    "Tanpa kategori"}
                                </p>

                                <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                  {isIncome
                                    ? "Pemasukan"
                                    : "Pengeluaran"}
                                </span>

                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-400">

                                <span>
                                  {transaction
                                    .account
                                    ?.name ||
                                    "Tanpa akun"}
                                </span>

                                <span>
                                  •
                                </span>

                                <span className="truncate">
                                  {transaction
                                    .notes ||
                                    "Tidak ada catatan"}
                                </span>

                              </div>

                            </div>

                          </div>

                          {/* RIGHT */}

                          <div className="flex items-center justify-between gap-5 md:justify-end">

                            <p
                              className={
                                isIncome
                                  ? "whitespace-nowrap font-bold text-gray-900"
                                  : "whitespace-nowrap font-bold text-gray-700"
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

                            <div className="flex gap-2 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">

                              <button
                                onClick={() =>
                                  handleEditTransaction(
                                    transaction
                                  )
                                }
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => {
                                  if (
                                    transactionId !==
                                    undefined
                                  ) {
                                    handleDeleteTransaction(
                                      transactionId
                                    )
                                  }
                                }}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              >
                                Hapus
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>
                    )
                  }
                )}

              </div>
            )}

          {/* =========================
              PAGINATION
          ========================= */}

          {!loading &&
            !error &&
            transactions.length >
              0 && (
              <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-gray-400">
                  Halaman{" "}
                  <span className="font-semibold text-gray-700">
                    {page}
                  </span>
                </p>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      setPage(
                        (
                          currentPage
                        ) =>
                          currentPage - 1
                      )
                    }
                    disabled={
                      page === 1
                    }
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Sebelumnya
                  </button>

                  <button
                    onClick={() =>
                      setPage(
                        (
                          currentPage
                        ) =>
                          currentPage + 1
                      )
                    }
                    disabled={
                      !hasNextPage
                    }
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Berikutnya →
                  </button>

                </div>

              </div>
            )}

        </section>

      </main>

    </div>
  )
}

export default Transactions