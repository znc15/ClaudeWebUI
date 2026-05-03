import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const breakdown = [
  { label: "系统提示", tokens: 0, color: "#cc6b3f" },
  { label: "工具定义", tokens: 0, color: "#5b7fb5" },
  { label: "对话历史", tokens: 0, color: "#7da77d" },
  { label: "当前输入", tokens: 0, color: "#b58a5b" },
];

export function ContextDetailsDialog({ open, onClose, isDark = false }: { open: boolean; onClose: () => void; isDark?: boolean }) {
  const total = 400_000;
  const used = 0;
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
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`relative w-[460px] max-w-[92vw] rounded-2xl shadow-2xl border overflow-hidden ${
              isDark
                ? "bg-[#1e1c18] border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                : "bg-white border-[#e8e4d8]"
            }`}
          >
            <div className={`flex items-start justify-between px-5 pt-5 pb-3 border-b ${isDark ? "border-white/8" : "border-[#f0ece0]"}`}>
              <div>
                <div className={isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"} style={{ fontSize: 16, fontFamily: "Georgia, serif" }}>上下文用量详情</div>
                <div className={`mt-0.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 12 }}>当前会话的 Token 使用分解</div>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-md transition active:scale-90 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"}`}
              >
                <X className={`w-4 h-4 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
              </button>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className={isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"} style={{ fontSize: 24, fontFamily: "Georgia, serif" }}>
                  {used.toLocaleString()}
                </span>
                <span className={isDark ? "text-[#6b6553]" : "text-[#a8a294]"} style={{ fontSize: 13 }}>/ {total.toLocaleString()} tokens</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden mb-4 ${isDark ? "bg-white/10" : "bg-[#f0ece0]"}`}>
                <motion.div
                  className="h-full bg-[#cc6b3f]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(used / total) * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>

              <div className="space-y-2">
                {breakdown.map(b => (
                  <div key={b.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />
                      <span className={isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"} style={{ fontSize: 13 }}>{b.label}</span>
                    </div>
                    <span className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"} style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}>
                      {b.tokens.toLocaleString()} tokens
                    </span>
                  </div>
                ))}
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? "border-white/8" : "border-[#f0ece0]"}`}>
                <span className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"} style={{ fontSize: 12 }}>预估费用</span>
                <span className={isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"} style={{ fontSize: 13 }}>$0.00</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}