type WorkspaceData = {
  id: number
  name: string
  description: string
}

type WorkspaceProps = {
  workspaces: WorkspaceData[]
  onSelectWorkspace: (workspace: WorkspaceData) => void
}

function Workspace({
  workspaces,
  onSelectWorkspace,
}: WorkspaceProps) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Pilih Workspace
          </h1>

          <p className="mt-2 text-gray-500">
            Pilih workspace yang ingin kamu gunakan
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              onClick={() => {
                console.log("Workspace dipilih:", workspace)

                onSelectWorkspace(workspace)
              }}
              className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {workspace.name}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {workspace.description}
              </p>

              <p className="mt-4 text-sm font-medium text-gray-900">
                Masuk ke workspace →
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Workspace