import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PanelLeft,
  PanelBottom,
  PanelRight,
  Folder,
  GitBranch,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const hiddenFolders = [
  ".ace-tool", ".anaconda", ".android", ".cache", ".conda", ".config",
  ".cursor", ".docker", ".gemini", ".gitconfig", ".gradle", ".npm",
  ".nuget", ".pylint.d", ".ssh", ".vscode", ".yarn",
];

const changes = [
  { file: "src/app/App.tsx", status: "M" },
  { file: "src/app/components/chat-view.tsx", status: "M" },
  { file: "src/app/components/settings-dialog.tsx", status: "A" },
  { file: "src/app/components/right-sidebar.tsx", status: "A" },
];

interface RightSidebarProps {
  open: boolean;
  width: number;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  isDragging: boolean;
  isDark?: boolean;
}

export function RightSidebar({ open, width, onToggle, onResizeStart, isDragging, isDark = false }: RightSidebarProps) {
  const [tab, setTab] = useState<"files" | "changes">("files");

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={isDragging ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 30 }}
          className={`border-l flex flex-col relative shrink-0 overflow-hidden ${
            isDark ? "border-white/10 bg-[#1c1a16]" : "border-[#e8e4d8] bg-[#faf9f4]"
          }`}
          style={{ width: open ? width : 0 }}
        >
          {/* Resize handle — left edge */}
          <div
            onMouseDown={onResizeStart}
            className="absolute top-0 left-0 w-1 h-full z-20 cursor-col-resize group"
          >
            <div className="w-full h-full group-hover:bg-[#cc6b3f]/25 transition-colors" />
          </div>

          {/* Layout controls */}
          <div className="flex items-center gap-1 px-3 pt-3 pb-2">
            <button
              onClick={() => toast("切换左侧栏")}
              className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
              title="左侧栏"
            >
              <PanelLeft className={`w-3.5 h-3.5 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
            </button>
            <button
              onClick={() => toast("切换底部面板")}
              className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
              title="底部面板"
            >
              <PanelBottom className={`w-3.5 h-3.5 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
            </button>
            <button
              onClick={onToggle}
              className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
              title="右侧栏"
            >
              <PanelRight className={`w-3.5 h-3.5 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className={`flex items-center gap-0.5 px-2 border-b ${isDark ? "border-white/10" : "border-[#e8e4d8]"}`}>
            <div className={`relative flex items-center ${
              tab === "files" ? (isDark ? "text-[#e8e3d8]" : "text-[#3d3929]") : (isDark ? "text-[#6b6553]" : "text-[#a8a294]")
            }`}>
              <button
                onClick={() => setTab("files")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 transition bg-transparent ${
                  tab === "files" ? "" : isDark ? "hover:text-[#9a9485]" : "hover:text-[#6b6553]"
                }`}
                style={{ fontSize: 12 }}
              >
                <Folder className="w-3.5 h-3.5" />
                文件
              </button>
              {tab === "files" && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); toast("关闭文件标签"); }}
                  className={`mr-1 p-0.5 rounded cursor-pointer transition ${isDark ? "hover:bg-white/10" : "hover:bg-[#e8e4d8]"}`}
                >
                  <X className="w-3 h-3" />
                </span>
              )}
              {tab === "files" && (
                <motion.div layoutId="rightTab" className="absolute inset-x-0 -bottom-px h-0.5 bg-[#cc6b3f]" />
              )}
            </div>
            <button
              onClick={() => setTab("changes")}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 transition bg-transparent ${
                tab === "changes"
                  ? isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"
                  : isDark ? "text-[#6b6553] hover:text-[#9a9485]" : "text-[#a8a294] hover:text-[#6b6553]"
              }`}
              style={{ fontSize: 12 }}
            >
              <GitBranch className="w-3.5 h-3.5" />
              变更
              {tab === "changes" && (
                <motion.div layoutId="rightTab" className="absolute inset-x-0 -bottom-px h-0.5 bg-[#cc6b3f]" />
              )}
            </button>
            <button
              onClick={() => toast("打开新视图")}
              className={`ml-auto p-1 rounded transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
            >
              <Plus className={`w-3.5 h-3.5 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto"
            >
              {tab === "files" ? (
                <div>
                  <div className={`px-3 pt-3 pb-1.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>文件浏览器</div>
                  <div className={`px-3 pb-1 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} style={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
                    C:/Users/YangXiaoMian
                  </div>
                  <div className="px-1 pb-3">
                    {hiddenFolders.map(f => (
                      <button
                        key={f}
                        onClick={() => toast(`打开 ${f}`)}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition text-left active:scale-[0.99] bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
                        style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}
                      >
                        <ChevronRight className={`w-3 h-3 shrink-0 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} />
                        {f === ".cursor" ? (
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" stroke="#cc6b3f" strokeWidth="2" strokeLinejoin="round" fill="#cc6b3f" fillOpacity="0.15" />
                          </svg>
                        ) : (
                          <Folder className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} />
                        )}
                        <span className={`truncate ${isDark ? "text-[#c8c3b5]" : "text-[#3d3929]"}`}>{f}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-1 pt-3">
                  <div className={`px-3 pb-2 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>已修改 ({changes.length})</div>
                  {changes.map(c => (
                    <button
                      key={c.file}
                      onClick={() => toast(`查看变更: ${c.file}`)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded transition text-left active:scale-[0.99] bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
                      style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}
                    >
                      <span
                        className={`w-4 h-4 inline-flex items-center justify-center rounded shrink-0 ${
                          c.status === "M" ? "text-[#b58a5b] bg-[#b58a5b]/15" : "text-[#7da77d] bg-[#7da77d]/15"
                        }`}
                        style={{ fontSize: 10 }}
                      >
                        {c.status}
                      </span>
                      <span className={`truncate ${isDark ? "text-[#c8c3b5]" : "text-[#3d3929]"}`}>{c.file}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}