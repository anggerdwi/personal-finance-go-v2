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
    throw new Error(data.error || "Gagal mengambil workspace")
  }

  return data.data.map((workspace: any) => ({
    id: workspace.ID,
    name: workspace.name,
    description: workspace.description,
  }))
}

export async function getDashboard(workspaceId: number) {
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
    throw new Error(data.error || "Gagal mengambil dashboard")
  }

  return data
}

export async function getTransactions(
  workspaceId: number,
  page = 1,
  limit = 10
) {
  const token = localStorage.getItem("token")

  const response = await fetch(
    `${API_URL}/transactions?workspace_id=${workspaceId}&page=${page}&limit=${limit}`,
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
