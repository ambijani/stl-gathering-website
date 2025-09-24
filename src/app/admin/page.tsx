export default function AdminHome() {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-black/70 dark:text-white/70 mt-1">Navigate to a section below.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li>
              <a className="block rounded-md border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 p-4 hover:bg-white/90 dark:hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" href="/admin/people">
                <div className="font-medium">People</div>
                <div className="text-sm text-black/70 dark:text-white/70">Manage participants</div>
              </a>
            </li>
            <li>
              <a className="block rounded-md border border-black/10 dark:border-white/10 bg-white/70 dark:bg:black/30 p-4 hover:bg-white/90 dark:hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" href="/admin/gatherings">
                <div className="font-medium">Dates & Varos</div>
                <div className="text-sm text-black/70 dark:text-white/70">Sessions and venues</div>
              </a>
            </li>
            <li className="sm:col-span-2">
              <a className="block rounded-md border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/30 p-4 hover:bg-white/90 dark:hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" href="/admin/analytics">
                <div className="font-medium">Analytics</div>
                <div className="text-sm text-black/70 dark:text-white/70">Overview and insights</div>
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  