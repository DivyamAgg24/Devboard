"use client"

import * as React from "react"
import { NavDocuments } from "@/src/components/nav-documents"
import { NavMain } from "@/src/components/nav-main"
import { NavSecondary } from "@/src/components/nav-secondary"
import { NavUser } from "@/src/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/src/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  GitBranchIcon,
  FolderIcon,
  Settings2Icon,
  CircleHelpIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  Target,
} from "lucide-react"

const data = {
  navMain: [
    { title: "Dashboard",    url: "/dashboard",       icon: <LayoutDashboardIcon /> },
    { title: "Tracked Repos",        url: "/dashboard/repos", icon: <Target /> },
    { title: "Projects",     url: "/dashboard/projects", icon: <FolderIcon /> },
  ],
  navSecondary: [
    { title: "Settings", url: "/dashboard/settings", icon: <Settings2Icon /> },
    { title: "Get Help",  url: "/dashboard/help",    icon: <CircleHelpIcon /> },
  ],
  documents: [
    { name: "Data Library", url: "/dashboard/data",    icon: <DatabaseIcon /> },
    { name: "Reports",      url: "/dashboard/reports", icon: <FileChartColumnIcon /> },
    { name: "Word Assistant", url: "/dashboard/docs",  icon: <FileIcon /> },
  ],
}

export function AppSidebar({ 
  user,
  ...props 
}: React.ComponentProps<typeof Sidebar> & {
  user?: { name: string; email: string; avatar: string }
}) {
  const resolvedUser = user ?? { name: "User", email: "", avatar: "" }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  )
}