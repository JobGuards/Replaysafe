export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your project and alert preferences.
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Project Settings</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Plan and project-level configurations will go here.</p>
          </div>
        </div>
        
        <div className="rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Alert Channels</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Configure how you want to be notified.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
