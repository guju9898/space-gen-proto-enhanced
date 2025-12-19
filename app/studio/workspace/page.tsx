export const dynamic = 'force-dynamic'
export const revalidate = false
export const fetchCache = 'force-no-store'

import WorkspaceClientPage from './WorkspaceClientPage'

export default function StudioWorkspacePage() {
  return <WorkspaceClientPage />
}
