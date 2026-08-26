import React, { useState } from 'react';
import {
 X,
 Award,
 BookOpen,
 Music,
 Radio,
 Sparkles,
 Calendar,
 Shield,
 Crown,
 Volume2,
 Send,
 Flame,
 CheckCircle2,
 Lock,
} from 'lucide-react';
import { Nation, NationalChronicleItem, NationalMedal, EmergencyBroadcast } from '../types';
import { PRESET_MEDALS, strategicStorage } from '../services/strategicGameplayService';

interface ChronicleAndMedalsModalProps {
 isOpen: boolean;
 onClose: () => void;
 myNation: Nation | null;
 onUpdateNation: (updated: Nation) => void;
 onShowToast: (msg: string) => void;
}

export const ChronicleAndMedalsModal: React.FC<ChronicleAndMedalsModalProps> = ({
 isOpen,
 onClose,
 myNation,
 onUpdateNation,
 onShowToast,
}) => {
 const [activeTab, setActiveTab] = useState<'chronicles' | 'medals' | 'anthem' | 'broadcast'>('medals');

 // Anthem Form
 const [selectedAnthem, setSelectedAnthem] = useState<string>(myNation?.nationalAnthem || '《万国荣光进行曲》');
 const [nationalMotto, setNationalMotto] = useState<string>(myNation?.nationalMotto || '钢铁与繁荣，荣耀归于领主');

 // Broadcast Form
 const [broadcastTitle, setBroadcastTitle] = useState('');
 const [broadcastContent, setBroadcastContent] = useState('');
 const [broadcastCategory, setBroadcastCategory] = useState<'summit' | 'war' | 'diplomacy' | 'wonder'>('summit');
 const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>(strategicStorage.getBroadcasts());

 if (!isOpen || !myNation) return null;

 // Unlocked Medals
 const unlockedMedalIds = myNation.unlockedMedalIds || ['medal_veteran_ruler', 'medal_wonder_builder'];
 if (myNation.isLingyuBaby && !unlockedMedalIds.includes('medal_lingyu_star')) {
  unlockedMedalIds.push('medal_lingyu_star');
 }

 // Chronicles List
 const defaultChronicles: NationalChronicleItem[] = [
  {
   id: 'chr_1',
   date: new Date(myNation.createdAt || Date.now()).toLocaleDateString(),
   title: `【${myNation.name}】宣告立国`,
   category: 'founding',
   description: `最高领主 ${myNation.ownerUsername} 在 ${myNation.capital} 庄严宣告建国，确立【${myNation.regime}】国策。`,
  },
  {
   id: 'chr_2',
   date: '近期',
   title: '颁布最高国家政府法令',
   category: 'decree',
   description: `国家内政院正式施行国策，全面激活全境省份军工与民用工业生产流水线。`,
  },
  {
   id: 'chr_3',
   date: '近期',
   title: '规划并启动省份传世奇观',
   category: 'wonder',
   description: `国家最高执政厅批准在本土省份启动传世巨构工程，为万世基业奠定宏伟基石。`,
  },
 ];

 const chronicles = myNation.chronicles || defaultChronicles;

 // Save Anthem
 const handleSaveAnthem = () => {
  const updatedNation: Nation = {
   ...myNation,
   nationalAnthem: selectedAnthem,
   nationalMotto,
  };
  onUpdateNation(updatedNation);
  onShowToast(` 国家国歌【${selectedAnthem}】与格言已正式录入国家典籍！`);
 };

 // Send Emergency Broadcast
 const handleSendBroadcast = (e: React.FormEvent) => {
  e.preventDefault();
  if (!broadcastTitle.trim() || !broadcastContent.trim()) return;

  const newBc: EmergencyBroadcast = {
   id: 'bc_' + Date.now(),
   senderNationId: myNation.id,
   senderNationName: myNation.name,
   senderOwnerName: myNation.ownerUsername,
   title: broadcastTitle.trim(),
   content: broadcastContent.trim(),
   category: broadcastCategory,
   createdAt: new Date().toISOString(),
  };

  const updated = [newBc, ...broadcasts];
  setBroadcasts(updated);
  strategicStorage.saveBroadcasts(updated);

  setBroadcastTitle('');
  setBroadcastContent('');
  onShowToast(` 已向全大陆所有国家紧急播发最高公报！`);
 };

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
   <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900">
    {/* Header */}
    <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
       <Award className="w-5 h-5" />
      </div>
      <div>
       <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
        <span>国家荣誉厅 · 功勋勋章与历史编年史</span>
       </h3>
       <p className="text-xs text-slate-400">
        勋章成就、国家历史百科大事记、国歌典律与全境公报广播台
       </p>
      </div>
     </div>
     <button
      onClick={onClose}
      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    {/* Sub Tabs */}
    <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 overflow-x-auto">
     {[
      { id: 'medals', label: '国家勋章与成就', icon: Award },
      { id: 'chronicles', label: '历史大事记编年史', icon: BookOpen },
      { id: 'anthem', label: '国家国歌与典律', icon: Music },
      { id: 'broadcast', label: '全国紧急公报广播台', icon: Radio },
     ].map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
       <button
        key={tab.id}
        type="button"
        onClick={() => setActiveTab(tab.id as any)}
        className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
         isActive
          ? 'border-amber-600 text-amber-600 bg-white rounded-t-lg'
          : 'border-transparent text-slate-500 hover:text-slate-800'
        }`}
       >
        <Icon className="w-3.5 h-3.5" />
        <span>{tab.label}</span>
       </button>
      );
     })}
    </div>

    {/* Tab Body */}
    <div className="p-6 overflow-y-auto flex-1 space-y-4">
     {/* TAB 1: MEDALS & ACHIEVEMENTS */}
     {activeTab === 'medals' && (
      <div className="space-y-4">
       <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950">
        <strong>国家勋章荣誉体系：</strong> 记录领主在军事、外交、基建奇观与社区中达成的卓越里程碑，彰显大国威望。
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESET_MEDALS.map((medal) => {
         const isUnlocked = unlockedMedalIds.includes(medal.id);
         return (
          <div
           key={medal.id}
           className={`p-4 rounded-2xl border transition-all ${
            isUnlocked
             ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200 shadow-xs'
             : 'bg-slate-50/60 border-slate-200 opacity-60'
           }`}
          >
           <div className="flex items-start gap-3">
            <div className="text-3xl p-2 bg-white rounded-xl shadow-xs border border-amber-200 shrink-0">
             {medal.icon}
            </div>
            <div className="flex-1">
             <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900">{medal.name}</h4>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-mono font-bold">
               {medal.rarity === 'legendary' ? '至尊' : medal.rarity === 'epic' ? '史诗' : '稀有'}
              </span>
             </div>
             <p className="text-[11px] text-slate-600 mt-1 leading-tight">{medal.description}</p>
             <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">条件: {medal.condition}</span>
              {isUnlocked ? (
               <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> 已佩戴
               </span>
              ) : (
               <span className="text-slate-400 flex items-center gap-0.5">
                <Lock className="w-3 h-3" /> 未解锁
               </span>
              )}
             </div>
            </div>
           </div>
          </div>
         );
        })}
       </div>
      </div>
     )}

     {/* TAB 2: NATIONAL CHRONICLES */}
     {activeTab === 'chronicles' && (
      <div className="space-y-4">
       <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700">
        <strong>【{myNation.name}】国家大事记编年史（国家百科档案）：</strong>
       </div>

       <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
        {chronicles.map((c) => (
         <div key={c.id} className="relative group">
          <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-xs" />
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
           <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900">{c.title}</span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
             <Calendar className="w-3 h-3" /> {c.date}
            </span>
           </div>
           <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
          </div>
         </div>
        ))}
       </div>
      </div>
     )}

     {/* TAB 3: NATIONAL ANTHEM */}
     {activeTab === 'anthem' && (
      <div className="space-y-4">
       <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900">
        <strong>国家国歌与典律定制：</strong> 为国家设定国歌旋律与立国格言，在万国大厅与首脑峰会中展示大国气度。
       </div>

       <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">选择国家国歌旋律</label>
        <select
         value={selectedAnthem}
         onChange={(e) => setSelectedAnthem(e.target.value)}
         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
        >
         <option value="《万国荣光进行曲》">《万国荣光进行曲》（激昂交响行进曲）</option>
         <option value="《帝国晨曦圣咏曲》">《帝国晨曦圣咏曲》（肃穆宏大管风琴圣咏）</option>
         <option value="《和平与星海颂歌》">《和平与星海颂歌》（宁静优美弦乐合奏）</option>
         <option value="《赛博纪元重工业狂想》">《赛博纪元重工业狂想》（电音合成波与重机械节奏）</option>
        </select>
       </div>

       <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">国家最高治国格言</label>
        <input
         type="text"
         value={nationalMotto}
         onChange={(e) => setNationalMotto(e.target.value)}
         placeholder="例如：钢铁与繁荣，荣耀归于领主"
         className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />
       </div>

       <button
        type="button"
        onClick={handleSaveAnthem}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
       >
        <Volume2 className="w-3.5 h-3.5" />
        <span>保存并载入国家国歌与格言</span>
       </button>
      </div>
     )}

     {/* TAB 4: EMERGENCY BROADCAST STATION */}
     {activeTab === 'broadcast' && (
      <div className="space-y-4">
       <form onSubmit={handleSendBroadcast} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
         <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
         <span>发布全国最高紧急公报广播</span>
        </div>

        <div>
         <label className="block text-[11px] font-bold text-slate-700 mb-1">公报标题</label>
         <input
          type="text"
          value={broadcastTitle}
          onChange={(e) => setBroadcastTitle(e.target.value)}
          placeholder="例如：【全国动员声明】关于落实战时工业与省份防空演练的最高通令"
          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
          required
         />
        </div>

        <div>
         <label className="block text-[11px] font-bold text-slate-700 mb-1">广播详细内容</label>
         <textarea
          rows={2}
          value={broadcastContent}
          onChange={(e) => setBroadcastContent(e.target.value)}
          placeholder="向全大陆所有国家和领主发送公报..."
          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
          required
         />
        </div>

        <div className="flex items-center justify-between pt-1">
         <select
          value={broadcastCategory}
          onChange={(e) => setBroadcastCategory(e.target.value as any)}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
         >
          <option value="summit">国家峰会公报</option>
          <option value="war">国防与军事通令</option>
          <option value="wonder">传世奇观竣工通报</option>
          <option value="diplomacy">多边同盟宣言</option>
         </select>

         <button
          type="submit"
          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
         >
          <Send className="w-3.5 h-3.5" />
          <span>播发全大陆广播</span>
         </button>
        </div>
       </form>

       {/* Broadcasts History */}
       <div className="space-y-2 pt-2">
        <div className="text-xs font-bold text-slate-700">最新全境紧急公报：</div>
        {broadcasts.map((b) => (
         <div key={b.id} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
           <span className="text-xs font-bold text-slate-900">{b.title}</span>
           <span className="text-[10px] text-slate-400 font-mono">
            {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{b.content}</p>
          <div className="text-[10px] text-slate-400 pt-0.5">
           发布国：{b.senderNationName} ({b.senderOwnerName})
          </div>
         </div>
        ))}
       </div>
      </div>
     )}
    </div>
   </div>
  </div>
 );
};
