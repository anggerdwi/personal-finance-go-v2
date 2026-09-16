import { useState } from "react"
import { LockKeyhole, Mail, Wallet } from "lucide-react"
import { getWorkspaces, login } from "../services/api"

type LoginProps = {
  onLoginSuccess: (workspaces: any[]) => void
}

function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")
    setLoading(true)

    try {
      const data = await login(email, password)

      console.log("Login berhasil:", data)

      const workspaces = await getWorkspaces()

      console.log("Workspace berhasil:", workspaces)

      onLoginSuccess(workspaces)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Login gagal")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 text-white mb-4">
            <Wallet size={28} />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Personal Finance
          </h1>

          <p className="text-gray-500 mt-2">
            Kelola keuanganmu dengan lebih mudah
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Selamat datang kembali
          </h2>

          <p className="text-sm text-gray-500 mt-1 mb-6">
            Silakan masuk ke akunmu
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Personal Finance App
        </p>

      </div>
    </div>
  )
}

export default Login