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

import type { ServerEntry } from "../types";

const navItems = [
  {
    group: "核心",
    items: [
      { key: "server", label: "服务器", icon: Server },
      { key: "model", label: "模型", icon: Cpu },
      { key: "agent", label: "Agent", icon: Bot },
      { key: "chat", label: "对话", icon: MessagesSquare },
      { key: "workspace", label: "工作区", icon: FolderOpen },
      { key: "appearance", label: "外观", icon: Palette },
      { key: "notification", label: "通知", icon: Bell },
    ],
  },
  {
    group: "高级",
    items: [
      { key: "shortcut", label: "快捷键", icon: Keyboard },
      { key: "about", label: "关于", icon: Info },
    ],
  },
];

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  servers: ServerEntry[];
  onSetActiveServer: (id: string) => void;
  onAddServer: (name: string, url: string) => void;
  onUpdateServer: (id: string, name: string, url: string) => void;
  onRemoveServer: (id: string) => void;
}

export function SettingsDialog({
  open,
  onClose,
  isDark,
  servers,
  onSetActiveServer,
  onAddServer,
  onUpdateServer,
  onRemoveServer,
}: SettingsDialogProps) {
  const [active, setActive] = useState("server");
  const [editingServer, setEditingServer] = useState<ServerEntry | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddServer = () => {
    if (!newName.trim() || !newUrl.trim()) {
      toast.error("请填写服务器名称和地址");
      return;
    }
    onAddServer(newName.trim(), newUrl.trim());
    setNewName("");
    setNewUrl("");
    setShowAddForm(false);
  };

  const handleUpdateServer = () => {
    if (!editingServer || !editName.trim() || !editUrl.trim()) {
      toast.error("请填写服务器名称和地址");
      return;
    }
    onUpdateServer(editingServer.id, editName.trim(), editUrl.trim());
    setEditingServer(null);
    setEditName("");
    setEditUrl("");
  };

  const startEdit = (server: ServerEntry) => {
    setEditingServer(server);
    setEditName(server.name);
    setEditUrl(server.url);
  };

  const cancelEdit = () => {
    setEditingServer(null);
    setEditName("");
    setEditUrl("");
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
            <div
              className={`w-56 shrink-0 border-r flex flex-col ${
                isDark
                  ? "bg-[#1a1917] border-white/10"
                  : "bg-[#faf9f4] border-[#e8e4d8]"
              }`}
            >
              <div className="px-4 pt-4 pb-3">
                <div
                  className={`${isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}`}
                  style={{ fontSize: 16, fontFamily: "Georgia, serif" }}
                >
                  设置
                </div>
                <div
                  className={`mt-0.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`}
                  style={{ fontSize: 11 }}
                >
                  自定义界面、行为和服务器配置
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 pb-2">
                {navItems.map((group) => (
                  <div key={group.group} className="mb-2">
                    <div
                      className={`px-3 py-1 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`}
                      style={{ fontSize: 11 }}
                    >
                      {group.group}
                    </div>
                    {group.items.map((it) => (
                      <button
                        key={it.key}
                        onClick={() => setActive(it.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-left transition-all active:scale-[0.98] bg-transparent ${
                          active === it.key
                            ? isDark
                              ? "bg-white/10 text-[#e8e3d8]"
                              : "bg-[#f0ece0] text-[#3d3929]"
                            : isDark
                            ? "text-[#9a9485] hover:bg-white/8 hover:text-[#c8c3b5]"
                            : "text-[#6b6553] hover:bg-[#f0ece0]/60"
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
              <div
                className={`px-4 py-3 border-t ${
                  isDark
                    ? "border-white/10 text-[#6b6553]"
                    : "border-[#e8e4d8] text-[#a8a294]"
                }`}
                style={{ fontSize: 11 }}
              >
                Claude WebUI v1.0
              </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
              <div
                className={`flex items-start justify-between px-6 pt-5 pb-4 border-b ${
                  isDark ? "border-white/8" : "border-[#f0ece0]"
                }`}
              >
                <div>
                  <div
                    className={isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}
                    style={{ fontSize: 16 }}
                  >
                    {navItems
                      .flatMap((g) => g.items)
                      .find((i) => i.key === active)?.label}
                  </div>
                  <div
                    className={`mt-0.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`}
                    style={{ fontSize: 12 }}
                  >
                    {active === "server"
                      ? "后端连接和快速切换活跃端点"
                      : "配置选项"}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${
                    isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"
                  }`}
                >
                  <X
                    className={`w-4 h-4 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`}
                  />
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
                            <div
                              className={isDark ? "text-[#e8e3d8]" : ""}
                              style={{ fontSize: 14 }}
                            >
                              连接
                            </div>
                            <div
                              className={
                                isDark ? "text-[#6b6553]" : "text-[#a8a294]"
                              }
                              style={{ fontSize: 12 }}
                            >
                              管理后端端点并选择本次会话使用的服务器
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toast("已刷新")}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition active:scale-95 bg-transparent ${
                                isDark
                                  ? "text-[#c8c3b5] hover:bg-white/8"
                                  : "hover:bg-[#f0ece0]"
                              }`}
                              style={{ fontSize: 12 }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              刷新
                            </button>
                            <button
                              onClick={() => setShowAddForm(true)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#cc6b3f] hover:bg-[#cc6b3f]/10 transition active:scale-95 bg-transparent"
                              style={{ fontSize: 12 }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              添加
                            </button>
                          </div>
                        </div>

                        {/* Add server form */}
                        {showAddForm && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-3 p-4 rounded-xl border ${
                              isDark
                                ? "border-white/10 bg-white/5"
                                : "border-[#e8e4d8] bg-[#faf9f4]"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-1">
                                <label
                                  className={`block mb-1 ${
                                    isDark ? "text-[#9a9485]" : "text-[#6b6553]"
                                  }`}
                                  style={{ fontSize: 12 }}
                                >
                                  名称
                                </label>
                                <input
                                  type="text"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  placeholder="服务器名称"
                                  className={`w-full px-3 py-2 rounded-lg border outline-none transition ${
                                    isDark
                                      ? "bg-white/5 border-white/10 text-[#e8e3d8] placeholder-[#6b6553] focus:border-[#cc6b3f]/50"
                                      : "bg-white border-[#e8e4d8] text-[#3d3929] placeholder-[#a8a294] focus:border-[#cc6b3f]/50"
                                  }`}
                                  style={{ fontSize: 13 }}
                                />
                              </div>
                              <div className="flex-1">
                                <label
                                  className={`block mb-1 ${
                                    isDark ? "text-[#9a9485]" : "text-[#6b6553]"
                                  }`}
                                  style={{ fontSize: 12 }}
                                >
                                  地址
                                </label>
                                <input
                                  type="text"
                                  value={newUrl}
                                  onChange={(e) => setNewUrl(e.target.value)}
                                  placeholder="http://localhost:4096"
                                  className={`w-full px-3 py-2 rounded-lg border outline-none transition ${
                                    isDark
                                      ? "bg-white/5 border-white/10 text-[#e8e3d8] placeholder-[#6b6553] focus:border-[#cc6b3f]/50"
                                      : "bg-white border-[#e8e4d8] text-[#3d3929] placeholder-[#a8a294] focus:border-[#cc6b3f]/50"
                                  }`}
                                  style={{ fontSize: 13 }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setShowAddForm(false);
                                  setNewName("");
                                  setNewUrl("");
                                }}
                                className={`px-3 py-1.5 rounded-md transition ${
                                  isDark
                                    ? "text-[#9a9485] hover:bg-white/8"
                                    : "text-[#6b6553] hover:bg-[#f0ece0]"
                                }`}
                                style={{ fontSize: 12 }}
                              >
                                取消
                              </button>
                              <button
                                onClick={handleAddServer}
                                className="px-3 py-1.5 rounded-md bg-[#cc6b3f] text-white hover:bg-[#b85f37] transition"
                                style={{ fontSize: 12 }}
                              >
                                添加
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* Server list */}
                        <div className="space-y-2">
                          {servers.map((s) => (
                            <motion.div
                              key={s.id}
                              layout
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
                                s.active
                                  ? "border-[#cc6b3f] bg-[#cc6b3f]/5"
                                  : isDark
                                  ? "border-white/10 hover:border-white/20"
                                  : "border-[#e8e4d8] hover:border-[#d9d5c7]"
                              }`}
                            >
                              {editingServer?.id === s.id ? (
                                // Edit mode
                                <div className="flex-1 flex items-center gap-3">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className={`flex-1 px-2 py-1 rounded border outline-none ${
                                      isDark
                                        ? "bg-white/5 border-white/10 text-[#e8e3d8]"
                                        : "bg-white border-[#e8e4d8] text-[#3d3929]"
                                    }`}
                                    style={{ fontSize: 13 }}
                                  />
                                  <input
                                    type="text"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    className={`flex-1 px-2 py-1 rounded border outline-none ${
                                      isDark
                                        ? "bg-white/5 border-white/10 text-[#e8e3d8]"
                                        : "bg-white border-[#e8e4d8] text-[#3d3929]"
                                    }`}
                                    style={{ fontSize: 13 }}
                                  />
                                  <button
                                    onClick={handleUpdateServer}
                                    className="px-2 py-1 rounded bg-[#cc6b3f] text-white text-xs"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className={`px-2 py-1 rounded text-xs ${
                                      isDark
                                        ? "bg-white/10 text-[#9a9485]"
                                        : "bg-[#f0ece0] text-[#6b6553]"
                                    }`}
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                // View mode
                                <>
                                  <button
                                    onClick={() => onSetActiveServer(s.id)}
                                    className="flex-1 flex items-center gap-3 text-left min-w-0 bg-transparent"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={isDark ? "text-[#e8e3d8]" : ""}
                                          style={{ fontSize: 14 }}
                                        >
                                          {s.name}
                                        </span>
                                        {s.active && (
                                          <span
                                            className="px-1.5 py-0.5 rounded text-white bg-[#cc6b3f]"
                                            style={{ fontSize: 10 }}
                                          >
                                            当前
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        className="text-[#5b7fb5] truncate"
                                        style={{
                                          fontSize: 12,
                                          fontFamily: "ui-monospace, monospace",
                                        }}
                                      >
                                        {s.url}
                                      </div>
                                    </div>
                                  </button>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {s.active ? (
                                      <Wifi className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => startEdit(s)}
                                          className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${
                                            isDark
                                              ? "hover:bg-white/8"
                                              : "hover:bg-[#f0ece0]"
                                          }`}
                                        >
                                          <Pencil
                                            className={`w-3.5 h-3.5 ${
                                              isDark
                                                ? "text-[#9a9485]"
                                                : "text-[#6b6553]"
                                            }`}
                                          />
                                        </button>
                                        <button
                                          onClick={() => onRemoveServer(s.id)}
                                          className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${
                                            isDark
                                              ? "hover:bg-red-900/30 hover:text-red-400"
                                              : "hover:bg-red-50 hover:text-red-600"
                                          }`}
                                        >
                                          <Trash2
                                            className={`w-3.5 h-3.5 ${
                                              isDark
                                                ? "text-[#9a9485]"
                                                : "text-[#6b6553]"
                                            }`}
                                          />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </div>

                        {servers.length === 0 && (
                          <div
                            className={`text-center py-8 ${
                              isDark ? "text-[#6b6553]" : "text-[#a8a294]"
                            }`}
                            style={{ fontSize: 13 }}
                          >
                            暂无服务器配置，点击"添加"创建一个
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"}
                        style={{ fontSize: 13 }}
                      >
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