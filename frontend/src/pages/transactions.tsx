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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [hasNextPage, setHasNextPage] = useState(false)

  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [accountId, setAccountId] = useState("")

  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  // =========================
  // FORM TRANSAKSI
  // =========================

  const [showForm, setShowForm] = useState(false)

  const [formType, setFormType] = useState("expense")
  const [formAmount, setFormAmount] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formAccountId, setFormAccountId] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // ID transaksi yang sedang diedit
  const [editingTransactionId, setEditingTransactionId] =
    useState<number | null>(null)

  // =========================
  // LOAD TRANSACTIONS
  // =========================

  const loadTransactions = async (
    requestedPage = page
  ) => {
    try {
      setLoading(true)
      setError("")

      const data = await getTransactions(
        workspace.id,
        requestedPage,
        limit,
        search,
        type,
        categoryId,
        accountId
      )

      console.log(
        "Transactions berhasil:",
        data
      )

      const transactionData =
        data.data || data

      setTransactions(transactionData)

      setHasNextPage(
        transactionData.length === limit
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
  // LOAD CATEGORY & ACCOUNT
  // =========================

  useEffect(() => {
    async function loadFilters() {
      try {
        const [
          categoryData,
          accountData,
        ] = await Promise.all([
          getCategories(workspace.id),
          getAccounts(workspace.id),
        ])

        setCategories(categoryData)
        setAccounts(accountData)
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
    setSearch(event.target.value)
    setPage(1)
  }

  const handleTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setType(event.target.value)
    setPage(1)
  }

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCategoryId(event.target.value)
    setPage(1)
  }

  const handleAccountChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setAccountId(event.target.value)
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
  // BUKA FORM TAMBAH
  // =========================

  const handleOpenForm = () => {
    setEditingTransactionId(null)

    setFormError("")

    setFormType("expense")
    setFormAmount("")
    setFormCategoryId("")
    setFormAccountId("")
    setFormNotes("")

    setShowForm(true)
  }

  // =========================
  // BUKA FORM EDIT
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
      setFormError(
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
      categoryValue !== undefined
        ? categoryValue.toString()
        : ""
    )

    setFormAccountId(
      accountValue !== undefined
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
  // DELETE TRANSAKSI
  // =========================

  const handleDeleteTransaction = async (
    transactionId: number
  ) => {
    if (!transactionId) {
      setError(
        "ID transaksi tidak ditemukan."
      )
      return
    }

    const confirmed = window.confirm(
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

      /*
       * Jika halaman sekarang kosong setelah
       * transaksi terakhir dihapus, kembali
       * ke halaman sebelumnya.
       */
      if (
        transactions.length === 1 &&
        page > 1
      ) {
        setPage(
          (currentPage) =>
            currentPage - 1
        )
      } else {
        await loadTransactions(page)
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
  // TUTUP FORM
  // =========================

  const handleCloseForm = () => {
    if (saving) {
      return
    }

    setShowForm(false)
    setEditingTransactionId(null)
    setFormError("")
  }

  // =========================
  // SIMPAN TRANSAKSI
  // =========================

  const handleSubmitTransaction = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setFormError("")

    const amount = Number(formAmount)

    // Validasi nominal
    if (!formAmount || amount <= 0) {
      setFormError(
        "Nominal transaksi harus lebih dari 0."
      )
      return
    }

    // Validasi kategori
    if (!formCategoryId) {
      setFormError(
        "Silakan pilih kategori."
      )
      return
    }

    // Validasi akun
    if (!formAccountId) {
      setFormError(
        "Silakan pilih akun."
      )
      return
    }

    try {
      setSaving(true)

      let data

      // =========================
      // EDIT
      // =========================

      if (
        editingTransactionId !== null
      ) {
        data =
          await updateTransaction(
            editingTransactionId,
            workspace.id,
            formType,
            amount,
            Number(formCategoryId),
            Number(formAccountId),
            formNotes
          )
      }

      // =========================
      // TAMBAH
      // =========================

      else {
        data =
          await createTransaction(
            workspace.id,
            formType,
            amount,
            Number(formCategoryId),
            Number(formAccountId),
            formNotes
          )
      }

      console.log(
        "Transaksi berhasil disimpan:",
        data
      )

      // Tutup form
      setShowForm(false)

      // Reset mode edit
      setEditingTransactionId(null)

      // Reset form
      setFormType("expense")
      setFormAmount("")
      setFormCategoryId("")
      setFormAccountId("")
      setFormNotes("")
      setFormError("")

      // Kembali ke halaman pertama
      setPage(1)

      // Refresh transaksi
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

        {/* =========================
            CARD UTAMA
        ========================= */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* =========================
              TITLE + BUTTON
          ========================= */}

          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-semibold text-gray-900">
                Semua Transaksi
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Daftar seluruh transaksi workspace{" "}
                {workspace.name}
              </p>

            </div>

            <button
              onClick={handleOpenForm}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              + Tambah Transaksi
            </button>

          </div>

          {/* =========================
              FORM TAMBAH / EDIT
          ========================= */}

          {showForm && (
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-6">

              <div className="mb-5">

                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTransactionId !== null
                    ? "Edit Transaksi"
                    : "Tambah Transaksi"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {editingTransactionId !== null
                    ? "Ubah data transaksi yang dipilih."
                    : "Masukkan data transaksi baru."}
                </p>

              </div>

              {/* FORM ERROR */}

              {formError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-sm text-red-600">
                    {formError}
                  </p>

                </div>
              )}

              <form
                onSubmit={
                  handleSubmitTransaction
                }
                className="space-y-5"
              >

                {/* TYPE */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Jenis Transaksi
                  </label>

                  <select
                    value={formType}
                    onChange={(event) =>
                      setFormType(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="expense">
                      Pengeluaran
                    </option>

                    <option value="income">
                      Pemasukan
                    </option>

                  </select>

                </div>

                {/* AMOUNT */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nominal
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={formAmount}
                    onChange={(event) =>
                      setFormAmount(
                        event.target.value
                      )
                    }
                    placeholder="Contoh: 50000"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* CATEGORY */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Kategori
                  </label>

                  <select
                    value={formCategoryId}
                    onChange={(event) =>
                      setFormCategoryId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Pilih kategori
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

                </div>

                {/* ACCOUNT */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Akun
                  </label>

                  <select
                    value={formAccountId}
                    onChange={(event) =>
                      setFormAccountId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >

                    <option value="">
                      Pilih akun
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

                {/* NOTES */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Catatan
                  </label>

                  <textarea
                    value={formNotes}
                    onChange={(event) =>
                      setFormNotes(
                        event.target.value
                      )
                    }
                    placeholder="Contoh: Makan siang"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* BUTTON */}

                <div className="flex justify-end gap-3 pt-2">

                  <button
                    type="button"
                    onClick={
                      handleCloseForm
                    }
                    disabled={saving}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Menyimpan..."
                      : editingTransactionId !== null
                        ? "Simpan Perubahan"
                        : "Simpan Transaksi"}
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* =========================
              FILTER
          ========================= */}

          <div className="border-t border-gray-100 px-6 py-5">

            <div>

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Cari catatan transaksi..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">

              {/* TYPE */}

              <select
                value={type}
                onChange={handleTypeChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              {/* CATEGORY */}

              <select
                value={categoryId}
                onChange={
                  handleCategoryChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

              {/* ACCOUNT */}

              <select
                value={accountId}
                onChange={
                  handleAccountChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              <div className="mt-4">

                <button
                  onClick={
                    handleResetFilter
                  }
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Reset semua filter
                </button>

              </div>
            )}

          </div>

          {/* =========================
              LOADING
          ========================= */}

          {loading && (
            <div className="border-t border-gray-100 px-6 py-8 text-center">

              <p className="text-sm text-gray-500">
                Memuat transaksi...
              </p>

            </div>
          )}

          {/* =========================
              ERROR
          ========================= */}

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-6 py-8">

              <p className="text-sm text-red-600">
                {error}
              </p>

            </div>
          )}

          {/* =========================
              EMPTY
          ========================= */}

          {!loading &&
            !error &&
            transactions.length === 0 && (
              <div className="border-t border-gray-100 px-6 py-8 text-center">

                <p className="text-sm text-gray-500">
                  {search ||
                  type ||
                  categoryId ||
                  accountId
                    ? "Transaksi tidak ditemukan"
                    : "Belum ada transaksi"}
                </p>

              </div>
            )}

          {/* =========================
              TRANSACTIONS
          ========================= */}

          {!loading &&
            !error &&
            transactions.length > 0 && (
              <div className="divide-y divide-gray-100">

                {transactions.map(
                  (transaction) => {

                    const transactionId =
                      transaction.ID ??
                      transaction.id

                    return (
                      <div
                        key={
                          transactionId
                        }
                        className="flex items-center justify-between px-6 py-5"
                      >

                        {/* INFO TRANSAKSI */}

                        <div>

                          <p className="font-medium text-gray-900">
                            {transaction
                              .category
                              ?.name ||
                              "Tanpa kategori"}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {transaction
                              .notes ||
                              "Tidak ada catatan"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {transaction
                              .account
                              ?.name ||
                              "Tanpa akun"}
                          </p>

                        </div>

                        {/* NOMINAL + ACTION */}

                        <div className="flex items-center gap-2">

                          <div className="mr-2 text-right">

                            <p
                              className={
                                transaction.type ===
                                "income"
                                  ? "font-semibold text-green-600"
                                  : "font-semibold text-red-600"
                              }
                            >

                              {transaction.type ===
                              "income"
                                ? "+"
                                : "-"}

                              {formatRupiah(
                                Math.abs(
                                  transaction.amount
                                )
                              )}

                            </p>

                          </div>

                          <button
                            onClick={() =>
                              handleEditTransaction(
                                transaction
                              )
                            }
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
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
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Hapus
                          </button>

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
            transactions.length > 0 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">

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
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Sebelumnya
                </button>

                <span className="text-sm text-gray-500">
                  Halaman {page}
                </span>

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
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya →
                </button>

              </div>
            )}

        </div>
      </div>
    </div>
  )
}

export default Transactions