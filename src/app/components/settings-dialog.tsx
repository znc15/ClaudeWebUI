import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Server,
  Cpu,
  Bot,
  MessagesSquare,
  FolderOpen,
  Palette,
  Bell,
  Keyboard,
  Info,
  RefreshCw,
  Plus,
  Wifi,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { group: "核心", items: [
    { key: "server", label: "服务器", icon: Server },
    { key: "model", label: "模型", icon: Cpu },
    { key: "agent", label: "Agent", icon: Bot },
    { key: "chat", label: "对话", icon: MessagesSquare },
    { key: "workspace", label: "工作区", icon: FolderOpen },
    { key: "appearance", label: "外观", icon: Palette },
    { key: "notification", label: "通知", icon: Bell },
  ]},
  { group: "高级", items: [
    { key: "shortcut", label: "快捷键", icon: Keyboard },
    { key: "about", label: "关于", icon: Info },
  ]},
];

type ServerEntry = { id: string; name: string; url: string; active: boolean };

export function SettingsDialog({ open, onClose, isDark = false }: { open: boolean; onClose: () => void; isDark?: boolean }) {
  const [active, setActive] = useState("server");
  const [servers, setServers] = useState<ServerEntry[]>([
    { id: "1", name: "Local", url: "http://127.0.0.1:4096", active: true },
    { id: "2", name: "MacBook", url: "http://100.80.44.37:8090", active: false },
  ]);

  const setActiveServer = (id: string) => {
    setServers(s => s.map(x => ({ ...x, active: x.id === id })));
    toast.success("已切换活跃服务器");
  };

  const addServer = () => {
    const id = String(Date.now());
    setServers(s => [...s, { id, name: "新服务器", url: "http://localhost:8080", active: false }]);
    toast.success("已添加服务器");
  };

  const removeServer = (id: string) => {
    setServers(s => s.filter(x => x.id !== id));
    toast("已删除服务器");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`relative w-[860px] max-w-[92vw] h-[560px] max-h-[88vh] rounded-2xl shadow-2xl border flex overflow-hidden ${
              isDark
                ? "bg-[#1e1c18] border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                : "bg-white border-[#e8e4d8]"
            }`}
          >
            {/* Sidebar */}
            <div className={`w-56 shrink-0 border-r flex flex-col ${isDark ? "bg-[#1a1917] border-white/10" : "bg-[#faf9f4] border-[#e8e4d8]"}`}>
              <div className="px-4 pt-4 pb-3">
                <div className={`${isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}`} style={{ fontSize: 16, fontFamily: "Georgia, serif" }}>设置</div>
                <div className={`mt-0.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>自定义界面、行为和服务器配置</div>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 pb-2">
                {navItems.map(group => (
                  <div key={group.group} className="mb-2">
                    <div className={`px-3 py-1 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>{group.group}</div>
                    {group.items.map(it => (
                      <button
                        key={it.key}
                        onClick={() => setActive(it.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-all active:scale-[0.98] bg-transparent ${
                          active === it.key
                            ? isDark ? "bg-white/10 text-[#e8e3d8]" : "bg-[#f0ece0] text-[#3d3929]"
                            : isDark ? "text-[#9a9485] hover:bg-white/8 hover:text-[#c8c3b5]" : "text-[#6b6553] hover:bg-[#f0ece0]/60"
                        }`}
                        style={{ fontSize: 13 }}
                      >
                        <it.icon className="w-3.5 h-3.5" />
                        {it.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
              <div className={`px-4 py-3 border-t ${isDark ? "border-white/10 text-[#6b6553]" : "border-[#e8e4d8] text-[#a8a294]"}`} style={{ fontSize: 11 }}>
                OpenCodeUI v0.5.20
              </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className={`flex items-start justify-between px-6 pt-5 pb-4 border-b ${isDark ? "border-white/8" : "border-[#f0ece0]"}`}>
                <div>
                  <div className={isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"} style={{ fontSize: 16 }}>
                    {navItems.flatMap(g => g.items).find(i => i.key === active)?.label}
                  </div>
                  <div className={`mt-0.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 12 }}>
                    {active === "server" ? "后端连接和快速切换活跃端点" : "配置选项"}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
                >
                  <X className={`w-4 h-4 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {active === "server" ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className={isDark ? "text-[#e8e3d8]" : ""} style={{ fontSize: 14 }}>连接</div>
                            <div className={isDark ? "text-[#6b6553]" : "text-[#a8a294]"} style={{ fontSize: 12 }}>管理后端端点并选择本次会话使用的服务器</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toast("已刷新")}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition active:scale-95 bg-transparent ${isDark ? "text-[#c8c3b5] hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
                              style={{ fontSize: 12 }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              刷新
                            </button>
                            <button
                              onClick={addServer}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#cc6b3f] hover:bg-[#cc6b3f]/10 transition active:scale-95 bg-transparent"
                              style={{ fontSize: 12 }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              添加
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {servers.map(s => (
                            <motion.div
                              key={s.id}
                              layout
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
                                s.active
                                  ? "border-[#cc6b3f] bg-[#cc6b3f]/5"
                                  : isDark ? "border-white/10 hover:border-white/20" : "border-[#e8e4d8] hover:border-[#d9d5c7]"
                              }`}
                            >
                              <button
                                onClick={() => setActiveServer(s.id)}
                                className="flex-1 flex items-center gap-3 text-left min-w-0 bg-transparent"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={isDark ? "text-[#e8e3d8]" : ""} style={{ fontSize: 14 }}>{s.name}</span>
                                    {s.active && (
                                      <span className="px-1.5 py-0.5 rounded text-white bg-[#cc6b3f]" style={{ fontSize: 10 }}>当前</span>
                                    )}
                                  </div>
                                  <div className="text-[#5b7fb5] truncate" style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}>{s.url}</div>
                                </div>
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                {s.active ? (
                                  <Wifi className="w-4 h-4 text-green-500" />
                                ) : (
                                  <>
                                    <button onClick={() => toast("已刷新连接")} className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}>
                                      <RefreshCw className={`w-3.5 h-3.5 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
                                    </button>
                                    <button onClick={() => toast("编辑服务器")} className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}>
                                      <Pencil className={`w-3.5 h-3.5 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
                                    </button>
                                    <button onClick={() => removeServer(s.id)} className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-red-900/30 hover:text-red-400" : "hover:bg-red-50 hover:text-red-600"}`}>
                                      <Trash2 className={`w-3.5 h-3.5 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"} style={{ fontSize: 13 }}>
                        该面板的设置项即将上线。
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}