// app/dashboard/layout.tsx
import { AppSidebar } from "@/src/components/app-sidebar"
import { SiteHeader } from "@/src/components/site-header"
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar"
import { getSession } from "@/src/utils/session"
import { db } from "@/src/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get real user for NavUser
  const session = await getSession()
  let user = { name: "User", email: "", avatar: "" }
  if (session.user) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, email: true }
    })
    if (dbUser) {
      user = {
        name: dbUser.username,
        email: dbUser.email,
        avatar: "",
      }
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}