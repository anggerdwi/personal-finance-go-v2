import { useState } from "react"
import Login from "./pages/login"
import Workspace from "./pages/workspace"
import Dashboard from "./pages/dashboard"
import Transactions from "./pages/transactions"

type WorkspaceData = {
  id: number
  name: string
  description: string
}

function App() {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[] | null>(null)
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceData | null>(null)

  const [page, setPage] = useState<"dashboard" | "transactions">(
    "dashboard"
  )

  // Belum login
  if (workspaces === null) {
    return (
      <Login
        onLoginSuccess={(data) => {
          setWorkspaces(data)
        }}
      />
    )
  }

  // Sudah login, belum memilih workspace
  if (selectedWorkspace === null) {
    return (
      <Workspace
        workspaces={workspaces}
        onSelectWorkspace={(workspace) => {
          setSelectedWorkspace(workspace)
        }}
      />
    )
  }

  // Sudah memilih workspace
  // Sudah memilih workspace
  if (page === "dashboard") {
    return (
      <Dashboard
        workspace={selectedWorkspace}
        onViewAllTransactions={() => {
          setPage("transactions")
        }}
      />
    )
  }

  return (
    <Transactions
      workspace={selectedWorkspace}
      onBack={() => {
        setPage("dashboard")
      }}
    />
  )
}

export default App