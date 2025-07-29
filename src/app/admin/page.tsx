export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the admin panel. This is where you can manage system
          settings, users, and other administrative tasks.
        </p>
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Admin functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
}
