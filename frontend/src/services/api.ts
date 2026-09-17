const API_URL = "http://localhost:8080"

export async function login(
  email: string,
  password: string
) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const text = await response.text()

  console.log("Status:", response.status)
  console.log("Response mentah:", text)

  let data

  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Response backend bukan JSON: ${text}`)
  }

  if (!response.ok) {
    throw new Error(data.error || "Login gagal")
  }

  localStorage.setItem("token", data.token)

  return data
}

export async function getWorkspaces() {
  const token = localStorage.getItem("token")

  const response = await fetch(`${API_URL}/workspaces`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal mengambil workspace"
    )
  }

  return data.data.map((workspace: any) => ({
    id: workspace.ID,
    name: workspace.name,
    description: workspace.description,
  }))
}

export async function getDashboard(
  workspaceId: number
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/dashboard?workspace_id=${workspaceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal mengambil dashboard"
    )
  }

  return data
}

export async function getTransactions(
  workspaceId: number,
  page = 1,
  limit = 10,
  search = "",
  type = "",
  categoryId = "",
  accountId = ""
) {
  const token = localStorage.getItem("token")

  const params = new URLSearchParams()

  params.append(
    "workspace_id",
    workspaceId.toString()
  )

  params.append("page", page.toString())
  params.append("limit", limit.toString())

  if (search) {
    params.append("search", search)
  }

  if (type) {
    params.append("type", type)
  }

  if (categoryId) {
    params.append("category_id", categoryId)
  }

  if (accountId) {
    params.append("account_id", accountId)
  }

  const response = await fetch(
    `${API_URL}/transactions?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal mengambil transaksi"
    )
  }

  return data
}

export async function getCategories(
  workspaceId: number
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/categories?workspace_id=${workspaceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal mengambil kategori"
    )
  }

  return data.data
}

export async function getAccounts(
  workspaceId: number
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/accounts?workspace_id=${workspaceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal mengambil akun"
    )
  }

  return (data.data || []).map(
    (account: any) => ({
      id: account.ID,
      name: account.name,
      balance: account.balance,
    })
  )
}

export async function createTransaction(
  workspaceId: number,
  type: string,
  amount: number,
  categoryId: number,
  accountId: number,
  notes: string
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/transactions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        type: type,
        amount: amount,
        category_id: categoryId,
        account_id: accountId,
        notes: notes,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal membuat transaksi"
    )
  }

  return data
}

export async function updateTransaction(
  transactionId: number,
  workspaceId: number,
  type: string,
  amount: number,
  categoryId: number,
  accountId: number,
  notes: string
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/transactions/${transactionId}?workspace_id=${workspaceId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: type,
        amount: amount,
        category_id: categoryId,
        account_id: accountId,
        notes: notes,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal mengubah transaksi"
    )
  }

  return data
}

export async function deleteTransaction(
  transactionId: number,
  workspaceId: number
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/transactions/${transactionId}?workspace_id=${workspaceId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error || "Gagal menghapus transaksi"
    )
  }

  return data
}

// ===============================
// SAVINGS GOALS
// ===============================

export async function getSavingsGoals(
  workspaceId: number
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/savings-goals?workspace_id=${workspaceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Gagal mengambil savings goal"
    )
  }

  return data
}

export async function createSavingsGoal(
  workspaceId: number,
  name: string,
  targetAmount: number,
  deadline: string,
  frequency: string
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/savings-goals`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        name: name,
        target_amount: targetAmount,
        deadline: deadline,
        frequency: frequency,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Gagal membuat savings goal"
    )
  }

  return data
}

export async function updateSavingsGoal(
  goalId: number,
  name: string,
  targetAmount: number,
  deadline: string,
  frequency: string
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/savings-goals/${goalId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name,
        target_amount: targetAmount,
        deadline: deadline,
        frequency: frequency,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Gagal mengubah savings goal"
    )
  }

  return data
}

export async function deleteSavingsGoal(
  goalId: number
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/savings-goals/${goalId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Gagal menghapus savings goal"
    )
  }

  return data
}

// ===============================
// SAVINGS DEPOSITS
// ===============================

export async function getSavingsDeposits(
  goalId: number
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/savings-goals/${goalId}/deposits`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Gagal mengambil deposit tabungan"
    )
  }

  return data
}

export async function createSavingsDeposit(
  goalId: number,
  accountId: number,
  amount: number,
  notes: string
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/savings-goals/${goalId}/deposit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        account_id: accountId,
        amount: amount,
        notes: notes,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Gagal menambahkan dana tabungan"
    )
  }

  return data
}