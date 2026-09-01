import { useState } from 'react'
import { AuditTrailView } from './components/views/AuditTrailView'
import { BoardSummaryView } from './components/views/BoardSummaryView'
import { ControlsView } from './components/views/ControlsView'
import { CriticalOperationsView } from './components/views/CriticalOperationsView'
import { ServiceProvidersView } from './components/views/ServiceProvidersView'
import { ToolInspectorView } from './components/views/ToolInspectorView'
import { HeaderBar } from './components/layout/HeaderBar'
import { Sidebar, type ViewId } from './components/layout/Sidebar'
import { RegisterProvider } from './context/RegisterContext'
import { ApprovalGate, ApprovalProvider } from './webmcp/approval'
import { isWebMCPSupported, useRegisteredToolNames } from './webmcp/registerTool'
import { BoardSummaryProvider, RegisterTools, useToolManifest } from './webmcp/tools'

function App() {
  return (
    <RegisterProvider>
      <BoardSummaryProvider>
        <ApprovalProvider>
          <AppShell />
        </ApprovalProvider>
      </BoardSummaryProvider>
    </RegisterProvider>
  )
}

// Sits inside all three providers so it can build the tool manifest (which
// needs live register/approval/board-summary access) once and share it with
// both the real WebMCP registration and the Tool Inspector view.
function AppShell() {
  const [activeView, setActiveView] = useState<ViewId>('operations')
  const supported = isWebMCPSupported()
  const toolNames = useRegisteredToolNames()
  const toolDefs = useToolManifest({ onBoardSummaryGenerated: () => setActiveView('board-summary') })

  return (
    <>
      <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
        <HeaderBar supported={supported} toolCount={toolNames.length} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar active={activeView} onSelect={setActiveView} />
          <main className="flex-1 overflow-y-auto p-6">
            {activeView === 'operations' && <CriticalOperationsView />}
            {activeView === 'controls' && <ControlsView />}
            {activeView === 'providers' && <ServiceProvidersView />}
            {activeView === 'audit' && <AuditTrailView />}
            {activeView === 'board-summary' && <BoardSummaryView />}
            {activeView === 'tool-inspector' && <ToolInspectorView toolDefs={toolDefs} />}
          </main>
        </div>
      </div>
      <ApprovalGate />
      <RegisterTools toolDefs={toolDefs} />
    </>
  )
}

export default App
