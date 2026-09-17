import { useState } from "react"
import Login from "./pages/login"
import Workspace from "./pages/workspace"
import Dashboard from "./pages/dashboard"
import Transactions from "./pages/transactions"
import SavingsGoal from "./pages/savingsGoal"

type WorkspaceData = {
  id: number
  name: string
  description: string
}

type Page =
  | "dashboard"
  | "transactions"
  | "savings"

function App() {
  const [workspaces, setWorkspaces] =
    useState<WorkspaceData[] | null>(null)

  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceData | null>(null)

  const [page, setPage] =
    useState<Page>("dashboard")

  // =========================
  // LOGIN
  // =========================

  if (workspaces === null) {
    return (
      <Login
        onLoginSuccess={(data) => {
          setWorkspaces(data)
        }}
      />
    )
  }

  // =========================
  // WORKSPACE
  // =========================

  if (selectedWorkspace === null) {
    return (
      <Workspace
        workspaces={workspaces}
        onSelectWorkspace={(workspace) => {
          setSelectedWorkspace(
            workspace
          )
        }}
      />
    )
  }

  // =========================
  // DASHBOARD
  // =========================

  if (page === "dashboard") {
    return (
      <Dashboard
        workspace={
          selectedWorkspace
        }

        onViewAllTransactions={() => {
          setPage("transactions")
        }}

        onViewSavingsGoals={() => {
          setPage("savings")
        }}
      />
    )
  }

  // =========================
  // TRANSACTIONS
  // =========================

  if (page === "transactions") {
    return (
      <Transactions
        workspace={
          selectedWorkspace
        }

        onBack={() => {
          setPage("dashboard")
        }}
      />
    )
  }

  // =========================
  // SAVINGS GOAL
  // =========================

  return (
    <SavingsGoal
      workspace={
        selectedWorkspace
      }

      onBack={() => {
        setPage("dashboard")
      }}
    />
  )
}

export default App