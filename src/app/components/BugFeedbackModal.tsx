import React, { useState } from "react";
import { Bug, Send, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { remoteState } from "../services/remoteState";

interface FeedbackItem {
 id: string;
 reporterId?: string;
 reporterName: string;
 category: string;
 content: string;
 createdAt: string;
 status: "open";
}

export function BugFeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
 const { user } = useAuth();
 const [category, setCategory] = useState("功能异常");
 const [content, setContent] = useState("");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [message, setMessage] = useState("");
 if (!isOpen) return null;

 const submit = async (event: React.FormEvent) => {
  event.preventDefault();
  const text = content.trim();
  if (text.length < 8) return setMessage("请至少填写 8 个字，说明问题现象或复现步骤。");
  setIsSubmitting(true); setMessage("");
  try {
   const item: FeedbackItem = {
    id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reporterId: user?.id,
    reporterName: user?.username || "匿名访客",
    category,
    content: text.slice(0, 1200),
    createdAt: new Date().toISOString(),
    status: "open",
   };
   await remoteState.updateSection<FeedbackItem[]>("bugFeedback", (current) => [item, ...(current || [])]);
   setContent("");
   setMessage("反馈已送达档案室，感谢协助修复。");
  } catch {
   setMessage("反馈暂未送达，请检查网络后重试。");
  } finally { setIsSubmitting(false); }
 };

 return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
  <form onSubmit={submit} className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#101822] text-slate-100 shadow-2xl">
   <div className="flex items-center justify-between border-b border-slate-700 bg-[#151f2b] px-5 py-4">
    <div className="flex items-center gap-2"><Bug className="h-5 w-5 text-amber-400" /><div><h2 className="text-sm font-black">Bug 反馈档案</h2><p className="text-[10px] text-slate-400">提交复现信息，帮助维护世界秩序</p></div></div>
    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"><X className="h-4 w-4" /></button>
   </div>
   <div className="space-y-4 p-5">
    <label className="block text-xs font-bold text-slate-300">问题类型
     <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-amber-400">
      <option>功能异常</option><option>数据不同步</option><option>显示与布局</option><option>性能与加载</option><option>其他问题</option>
     </select>
    </label>
    <label className="block text-xs font-bold text-slate-300">问题描述 / 复现步骤
     <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="例如：进入科研页后，手指拖动科技树没有反应……" className="mt-1.5 min-h-32 w-full resize-y rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm leading-6 outline-none placeholder:text-slate-500 focus:border-amber-400" />
    </label>
    {message && <p className={`text-xs ${message.includes("已送达") ? "text-emerald-400" : "text-rose-400"}`}>{message}</p>}
    <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"><Send className="h-4 w-4" />{isSubmitting ? "正在送达..." : "提交 Bug 反馈"}</button>
   </div>
  </form>
 </div>;
}
