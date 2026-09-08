import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  PlusCircle,
  History,
  Layers,
  Boxes,
  Globe,
  Compass,
  ShoppingBag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Nation } from '../types';
import { STANDARD_EQUIPMENT_TEMPLATES } from '../lib/militaryIndustry';
import {
  ArmsMarketListing,
  ArmsTradeTransaction,
  TradeRouteVerificationResult,
  verifyLandTradeRoute,
  getSavedArmsListings,
  saveArmsListings,
  getSavedTransactions,
  saveTransactionRecord,
} from '../lib/tradeRouteEngine';
import { renderEquipmentTacticalIcon } from '../lib/icons';

interface StrategicMarketViewProps {
  myNation: Nation | null;
  allNations: Nation[];
  onUpdateNationStockpile?: (updatedStockpiles: Record<string, number>, updatedTreasury?: number) => void;
  onShowToast: (msg: string) => void;
  onOpenNationDetail?: (nation: Nation) => void;
  onNavigateToMap?: () => void;
}

export const StrategicMarketView: React.FC<StrategicMarketViewProps> = ({
  myNation,
  allNations,
  onUpdateNationStockpile,
  onShowToast,
  onOpenNationDetail,
  onNavigateToMap,
}) => {
  // Tab state: 'market' (军火市场), 'sell' (发布外销), 'my_listings' (我的外销), 'corridor' (走廊勘测), 'history' (交易记录)
  const [activeSubTab, setActiveSubTab] = useState<'market' | 'sell' | 'my_listings' | 'corridor' | 'history'>('market');

  // Listings & History state
  const [listings, setListings] = useState<ArmsMarketListing[]>(() => getSavedArmsListings());
  const [transactions, setTransactions] = useState<ArmsTradeTransaction[]>(() => getSavedTransactions());

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'qty_desc' | 'latest'>('price_asc');
  const [onlyReachable, setOnlyReachable] = useState(false);

  // Purchase Modal State
  const [purchasingListing, setPurchasingListing] = useState<ArmsMarketListing | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(100);

  // Sell Form State
  const [sellEquipmentId, setSellEquipmentId] = useState<string>('eq_rifle');
  const [sellQuantity, setSellQuantity] = useState<number>(1000);
  const [sellUnitPrice, setSellUnitPrice] = useState<number>(15);
  const [sellMinBatch, setSellMinBatch] = useState<number>(50);
  const [sellDescription, setSellDescription] = useState<string>('');

  // Corridor Simulator State
  const [corridorTargetNationId, setCorridorTargetNationId] = useState<string>(() => {
    const foreign = allNations.find((n) => n.id !== myNation?.id);
    return foreign ? foreign.id : '';
  });

  // Calculate my nation's Lingyu Coin balance
  const currencyRate = Number(myNation?.currencyRate) || 1;
  const rawTreasury = Number(myNation?.treasury) || Number((myNation as any)?.economy?.treasury) || 25000;
  const myTreasuryInLingyu = Math.round(rawTreasury * currencyRate);

  // My current equipment stockpiles
  const myStockpiles = useMemo(() => {
    return (myNation?.militaryIndustry?.stockpiles as Record<string, number>) || {};
  }, [myNation]);

  // Map of nation ID to Nation object
  const nationMap = useMemo(() => {
    const map = new Map<string, Nation>();
    allNations.forEach((n) => map.set(n.id, n));
    return map;
  }, [allNations]);

  // Pre-calculate corridor connectivity for each listing against my nation
  const listingVerificationMap = useMemo(() => {
    const map = new Map<string, TradeRouteVerificationResult>();
    if (!myNation) return map;

    listings.forEach((listing) => {
      const sellerNation = nationMap.get(listing.sellerNationId) || ({
        id: listing.sellerNationId,
        name: listing.sellerNationName,
        provinces: [],
      } as unknown as Nation);

      const result = verifyLandTradeRoute(myNation, sellerNation, allNations);
      map.set(listing.id, result);
    });

    return map;
  }, [listings, myNation, nationMap, allNations]);

  // Filtered & Sorted listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.equipmentName.toLowerCase().includes(q);
          const matchSeller = item.sellerNationName.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchName && !matchSeller && !matchDesc) return false;
        }
        if (onlyReachable) {
          const ver = listingVerificationMap.get(item.id);
          if (!ver || !ver.canTrade) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.unitPriceLingyu - b.unitPriceLingyu;
        if (sortBy === 'price_desc') return b.unitPriceLingyu - a.unitPriceLingyu;
        if (sortBy === 'qty_desc') return b.availableQuantity - a.availableQuantity;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [listings, selectedCategory, searchQuery, sortBy, onlyReachable, listingVerificationMap]);

  // My own active listings
  const myListings = useMemo(() => {
    if (!myNation) return [];
    return listings.filter((l) => l.sellerNationId === myNation.id);
  }, [listings, myNation]);

  // Handle open purchase modal
  const handleOpenPurchase = (listing: ArmsMarketListing) => {
    setPurchasingListing(listing);
    setPurchaseQuantity(Math.min(listing.availableQuantity, Math.max(listing.minBatch, 100)));
  };

  // Selected listing verification
  const currentPurchaseVerification: TradeRouteVerificationResult | null = useMemo(() => {
    if (!purchasingListing || !myNation) return null;
    const sellerNation = nationMap.get(purchasingListing.sellerNationId) || ({
      id: purchasingListing.sellerNationId,
      name: purchasingListing.sellerNationName,
      provinces: [],
    } as unknown as Nation);

    return verifyLandTradeRoute(myNation, sellerNation, allNations);
  }, [purchasingListing, myNation, nationMap, allNations]);

  // Execute purchase
  const handleConfirmPurchase = () => {
    if (!purchasingListing || !myNation) return;
    if (!currentPurchaseVerification || !currentPurchaseVerification.canTrade) {
      onShowToast('❌ 陆上补给走廊受阻，无法完成军火运输！');
      return;
    }

    const totalCostLingyu = purchasingListing.unitPriceLingyu * purchaseQuantity;
    if (myTreasuryInLingyu < totalCostLingyu) {
      onShowToast(`❌ 玲玉币国库余额不足！需要 ${totalCostLingyu.toLocaleString()} 玲玉币，当前仅有 ${myTreasuryInLingyu.toLocaleString()} 玲玉币`);
      return;
    }

    // 1. Update buyer stockpile
    const currentQty = Number(myStockpiles[purchasingListing.equipmentId]) || 0;
    const newStockpiles = {
      ...myStockpiles,
      [purchasingListing.equipmentId]: currentQty + purchaseQuantity,
    };

    // 2. Deduct Lingyu coin from treasury
    const newTreasuryRaw = Math.max(0, rawTreasury - totalCostLingyu / currencyRate);

    // 3. Update market listing quantity
    const updatedListings = listings
      .map((l) => {
        if (l.id === purchasingListing.id) {
          const remain = l.availableQuantity - purchaseQuantity;
          return {
            ...l,
            availableQuantity: remain,
            soldCount: (l.soldCount || 0) + purchaseQuantity,
          };
        }
        return l;
      })
      .filter((l) => l.availableQuantity > 0);

    setListings(updatedListings);
    saveArmsListings(updatedListings);

    // 4. Record transaction in ledger
    const newTx: ArmsTradeTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      buyerNationId: myNation.id,
      buyerNationName: myNation.name,
      sellerNationId: purchasingListing.sellerNationId,
      sellerNationName: purchasingListing.sellerNationName,
      equipmentId: purchasingListing.equipmentId,
      equipmentName: purchasingListing.equipmentName,
      quantity: purchaseQuantity,
      unitPriceLingyu: purchasingListing.unitPriceLingyu,
      totalCostLingyu,
      transitPath: currentPurchaseVerification.waypoints.map((w) => `${w.chineseName || w.provinceName}(${w.ownerNationName})`),
      status: 'completed',
      note: currentPurchaseVerification.summaryText,
    };

    const nextTxList = [newTx, ...transactions].slice(0, 100);
    setTransactions(nextTxList);
    saveTransactionRecord(newTx);

    // 5. Trigger parent updates
    if (onUpdateNationStockpile) {
      onUpdateNationStockpile(newStockpiles, newTreasuryRaw);
    }

    onShowToast(`🎉 成功采购 ${purchaseQuantity.toLocaleString()} 件【${purchasingListing.equipmentName}】！支付 ${totalCostLingyu.toLocaleString()} 玲玉币，军火已入库！`);
    setPurchasingListing(null);
  };

  // Publish new listing from my nation
  const handlePublishListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myNation) {
      onShowToast('请先登录并创建国家后再发布挂单');
      return;
    }

    const currentOwnedQty = Number(myStockpiles[sellEquipmentId]) || 0;
    if (currentOwnedQty < sellQuantity) {
      onShowToast(`❌ 本国武器库中【${STANDARD_EQUIPMENT_TEMPLATES.find((t) => t.id === sellEquipmentId)?.name || '该装备'}】库存仅有 ${currentOwnedQty.toLocaleString()}，不足以挂单 ${sellQuantity.toLocaleString()}`);
      return;
    }

    if (sellQuantity <= 0 || sellUnitPrice <= 0) {
      onShowToast('挂单数量与单价必须大于 0');
      return;
    }

    const tmpl = STANDARD_EQUIPMENT_TEMPLATES.find((t) => t.id === sellEquipmentId);
    const equipmentName = tmpl?.name || sellEquipmentId;
    const category = tmpl?.category || 'infantry';

    // Deduct from national stockpile to lock inventory
    const newStockpiles = {
      ...myStockpiles,
      [sellEquipmentId]: currentOwnedQty - sellQuantity,
    };

    const newListing: ArmsMarketListing = {
      id: 'mkt_user_' + Math.random().toString(36).substring(2, 9),
      sellerNationId: myNation.id,
      sellerNationName: myNation.name,
      sellerOwnerName: myNation.ownerDouyinName || '国家外贸使团',
      sellerFlagColor: myNation.flagColor || '#2563eb',
      sellerEmblemIcon: myNation.emblemIcon || 'Shield',
      isAiCompany: false,
      equipmentId: sellEquipmentId,
      equipmentName,
      category,
      tier: 1,
      unitPriceLingyu: sellUnitPrice,
      availableQuantity: sellQuantity,
      minBatch: Math.min(sellQuantity, Math.max(1, sellMinBatch)),
      description: sellDescription.trim() || `由【${myNation.name}】国防军工部出品，陆路支持过境交付。`,
      createdAt: new Date().toISOString(),
      soldCount: 0,
    };

    const nextListings = [newListing, ...listings];
    setListings(nextListings);
    saveArmsListings(nextListings);

    if (onUpdateNationStockpile) {
      onUpdateNationStockpile(newStockpiles);
    }

    onShowToast(`✅ 成功将 ${sellQuantity.toLocaleString()} 件【${equipmentName}】挂单至战略军火市场！`);
    setActiveSubTab('my_listings');
  };

  // Cancel my own listing and return stock to arsenal
  const handleCancelListing = (listingId: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing || !myNation || listing.sellerNationId !== myNation.id) return;

    const currentOwnedQty = Number(myStockpiles[listing.equipmentId]) || 0;
    const newStockpiles = {
      ...myStockpiles,
      [listing.equipmentId]: currentOwnedQty + listing.availableQuantity,
    };

    const nextListings = listings.filter((l) => l.id !== listingId);
    setListings(nextListings);
    saveArmsListings(nextListings);

    if (onUpdateNationStockpile) {
      onUpdateNationStockpile(newStockpiles);
    }

    onShowToast(`已下架挂单，${listing.availableQuantity.toLocaleString()} 件【${listing.equipmentName}】已退回本国军械库！`);
  };

  // Corridor target nation verification
  const corridorVerification: TradeRouteVerificationResult | null = useMemo(() => {
    if (!myNation || !corridorTargetNationId) return null;
    const targetNat = nationMap.get(corridorTargetNationId);
    if (!targetNat) return null;
    return verifyLandTradeRoute(myNation, targetNat, allNations);
  }, [myNation, corridorTargetNationId, nationMap, allNations]);

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'infantry', label: '步兵枪械' },
    { id: 'artillery', label: '野战火炮' },
    { id: 'armor', label: '装甲车辆' },
    { id: 'motorized', label: '后勤机动' },
    { id: 'support', label: '支援装备' },
    { id: 'aviation', label: '航空装备' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-3.5 pb-12 animate-fadeIn text-slate-800 select-none">
      {/* 1. Header Area: 紧凑清晰无厚重背景 */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2.5 border-b border-slate-200">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            战略军火与重装备交易公署
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            跨国军备调配与外贸公署 · 遵循地缘陆上走廊通行判定
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs self-start sm:self-auto font-mono">
          <div className="flex items-baseline gap-1.5 text-slate-600">
            <span className="text-slate-400 text-[11px]">玲玉币余额:</span>
            <span className="font-bold text-orange-600 text-sm">
              ¥{myTreasuryInLingyu.toLocaleString()}
            </span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <div className="text-slate-500 text-xs hidden sm:block">
            全服挂单: <span className="text-slate-700 font-semibold">{listings.length}</span>
          </div>
        </div>
      </div>

      {/* 2. 任务栏结构重构:
          第一层: 市场主导航 (军火市场 / 发布外销 / 我的订单 / 交易记录)
          第二层/右侧: 辅助功能入口 (走廊勘测 / 战略地图)
      */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-1">
        {/* 第一层: 市场主导航 */}
        <nav aria-label="市场主导航" className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveSubTab('market')}
            className={`px-3 py-1.5 rounded-t text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'market'
                ? 'text-slate-900 bg-slate-100/70 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>军火市场</span>
            {activeSubTab === 'market' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('sell')}
            className={`px-3 py-1.5 rounded-t text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'sell'
                ? 'text-slate-900 bg-slate-100/70 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>发布外销</span>
            {activeSubTab === 'sell' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('my_listings')}
            className={`px-3 py-1.5 rounded-t text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'my_listings'
                ? 'text-slate-900 bg-slate-100/70 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>我的订单</span>
            {myListings.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono font-medium">
                {myListings.length}
              </span>
            )}
            {activeSubTab === 'my_listings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-t text-xs font-semibold whitespace-nowrap transition-colors relative cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeSubTab === 'history'
                ? 'text-slate-900 bg-slate-100/70 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <span>交易记录</span>
            {activeSubTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        </nav>

        {/* 第二层/右侧: 辅助功能入口 (走廊勘察 ｜ 战略地图) */}
        <div className="flex items-center gap-2 self-start sm:self-center text-xs text-slate-500 font-medium pb-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('corridor')}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 text-[11px] ${
              activeSubTab === 'corridor'
                ? 'text-slate-900 bg-slate-100 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title="勘测本国与其他国家的陆上贸易走廊通行情况"
          >
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <span>走廊勘测</span>
          </button>

          <span className="text-slate-300">|</span>

          {onNavigateToMap ? (
            <button
              type="button"
              onClick={onNavigateToMap}
              className="px-2 py-1 rounded text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
              title="切换至世界战略大地图视图"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>战略地图</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">战略地图</span>
          )}
        </div>
      </div>

      {/* 3. Sub-View Content */}
      <AnimatePresence mode="wait">
        {/* VIEW 1: 军火市场 (Market Browse & Purchase) */}
        {activeSubTab === 'market' && (
          <motion.div
            key="market-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3.5"
          >
            {/* 6. 重新设计装备分类导航: 明确区分于上方主导航 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs text-slate-600">
              <span className="text-slate-400 text-[11px] font-mono shrink-0 mr-1">分类</span>
              <div className="flex items-center gap-1 shrink-0">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'text-slate-900 font-bold bg-slate-100 border border-slate-200/80 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. 搜索与筛选: 紧凑工具栏 */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索装备型号或国家..."
                  className="w-full bg-slate-50/80 border border-slate-200 rounded px-2.5 pl-8 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">排序:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-0 text-slate-700 text-xs font-medium focus:outline-none cursor-pointer py-1"
                  >
                    <option value="price_asc">价格从低到高</option>
                    <option value="price_desc">价格从高到低</option>
                    <option value="qty_desc">库存从多到少</option>
                    <option value="latest">最新上架</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyReachable}
                    onChange={(e) => setOnlyReachable(e.target.checked)}
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 w-3.5 h-3.5"
                  />
                  <span>只看陆路畅通</span>
                </label>
              </div>
            </div>

            {/* 7. 装备列表: 紧凑现代战略交易列表 */}
            {filteredListings.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <Boxes className="w-7 h-7 mx-auto stroke-1 text-slate-300" />
                <p>未找到匹配的军火挂单</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setOnlyReachable(false);
                  }}
                  className="text-xs text-orange-600 hover:underline cursor-pointer"
                >
                  重置筛选条件
                </button>
              </div>
            ) : (
              <div className="border-t border-b border-slate-200">
                {/* 战略数据列表表头 */}
                <div className="hidden md:grid grid-cols-12 gap-3 py-2.5 text-[11px] font-mono text-slate-400 border-b border-slate-100">
                  <div className="col-span-4 pl-2">装备型号 / 军械说明</div>
                  <div className="col-span-2">制造国 / 供方</div>
                  <div className="col-span-2 text-right">现货库存</div>
                  <div className="col-span-2 text-right">单价 (玲玉币)</div>
                  <div className="col-span-2 text-right pr-2">状态 / 操作</div>
                </div>

                {/* 装备行 */}
                <div className="divide-y divide-slate-100 text-xs">
                  {filteredListings.map((listing) => {
                    const verification = listingVerificationMap.get(listing.id);
                    const isReachable = verification?.canTrade ?? false;
                    const isMyOwn = myNation?.id === listing.sellerNationId;

                    return (
                      <div
                        key={listing.id}
                        className={`py-3 px-2 transition-colors hover:bg-slate-50/70 ${
                          isMyOwn ? 'bg-orange-50/20' : ''
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 md:items-center">
                          {/* 装备图标与名称 */}
                          <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                              {renderEquipmentTacticalIcon(listing.equipmentId, { className: 'w-4 h-4 text-slate-700' })}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 truncate">
                                  {listing.equipmentName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {categories.find((c) => c.id === listing.category)?.label || listing.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-sm">
                                {listing.description || '标准军规装备'}
                              </p>
                            </div>
                          </div>

                          {/* 制造国 */}
                          <div className="md:col-span-2 flex items-center gap-1.5 text-slate-600 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: listing.sellerFlagColor || '#3b82f6' }}
                            />
                            <span className="truncate">{listing.sellerNationName}</span>
                            {listing.isAiCompany && (
                              <span className="text-[10px] text-slate-400">财阀</span>
                            )}
                            {isMyOwn && (
                              <span className="text-[10px] text-orange-600 font-medium">本国</span>
                            )}
                          </div>

                          {/* 库存 */}
                          <div className="md:col-span-2 flex md:justify-end items-baseline gap-1 font-mono">
                            <span className="md:hidden text-slate-400 text-[11px]">库存:</span>
                            <span className="text-slate-800 font-medium">
                              {listing.availableQuantity.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-slate-400">件</span>
                          </div>

                          {/* 单价 */}
                          <div className="md:col-span-2 flex md:justify-end items-baseline gap-0.5 font-mono">
                            <span className="md:hidden text-slate-400 text-[11px]">单价:</span>
                            <span className="font-bold text-orange-600">
                              ¥{listing.unitPriceLingyu.toLocaleString()}
                            </span>
                          </div>

                          {/* 状态与操作入口 */}
                          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                            {/* 8. 状态设计: 小型状态标签 */}
                            <button
                              type="button"
                              onClick={() => {
                                setCorridorTargetNationId(listing.sellerNationId);
                                setActiveSubTab('corridor');
                              }}
                              className="cursor-pointer flex items-center gap-1"
                              title={isReachable ? '走廊畅通，点击勘测' : '走廊受阻，点击查看断点'}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isReachable ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                              />
                              <span
                                className={`text-[11px] font-mono ${
                                  isReachable ? 'text-emerald-700' : 'text-red-700'
                                }`}
                              >
                                {isReachable ? '畅通' : '受阻'}
                              </span>
                            </button>

                            {/* 操作 */}
                            {isMyOwn ? (
                              <button
                                type="button"
                                onClick={() => handleCancelListing(listing.id)}
                                className="text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer py-1 px-2"
                              >
                                撤销
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPurchase(listing)}
                                disabled={!isReachable}
                                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                                  isReachable
                                    ? 'bg-slate-900 text-white hover:bg-orange-500'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                采购
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 2: 发布外销 (Publish Listing) */}
        {activeSubTab === 'sell' && (
          <motion.div
            key="sell-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-lg mx-auto py-4 space-y-5"
          >
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">
                发布军火外销挂单
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                从本国军械储备中挂售富余装备，售出后资金自动汇入国库。
              </p>
            </div>

            <form onSubmit={handlePublishListing} className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>选择外销装备型号</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    可用库存: {(Number(myStockpiles[sellEquipmentId]) || 0).toLocaleString()} 件
                  </span>
                </div>
                <select
                  value={sellEquipmentId}
                  onChange={(e) => {
                    setSellEquipmentId(e.target.value);
                    const currentMax = Number(myStockpiles[e.target.value]) || 0;
                    setSellQuantity(Math.min(currentMax, 1000));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400"
                >
                  {STANDARD_EQUIPMENT_TEMPLATES.map((tmpl) => {
                    const count = Number(myStockpiles[tmpl.id]) || 0;
                    return (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} (库存: {count.toLocaleString()} {tmpl.unitName})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>挂单外销数量</span>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    {[25, 50, 75, 100].map((pct) => {
                      const totalOwned = Number(myStockpiles[sellEquipmentId]) || 0;
                      const val = Math.floor((totalOwned * pct) / 100);
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setSellQuantity(val)}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                        >
                          {pct}%
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={Number(myStockpiles[sellEquipmentId]) || 0}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-slate-700 font-medium block">单价 (玲玉币 / 件)</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                      ¥
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={sellUnitPrice}
                      onChange={(e) => setSellUnitPrice(Number(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded pl-6 pr-2.5 py-1.5 text-xs text-orange-600 font-mono font-bold focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-700 font-medium block">最小起订量 (批次)</span>
                  <input
                    type="number"
                    min={1}
                    max={sellQuantity}
                    value={sellMinBatch}
                    onChange={(e) => setSellMinBatch(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-700 font-medium block">外销批次说明 (选填)</span>
                <input
                  type="text"
                  value={sellDescription}
                  onChange={(e) => setSellDescription(e.target.value)}
                  placeholder="例：由本国国防总装部精工锻造，品相完好..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="py-2.5 border-t border-b border-slate-100 flex items-center justify-between font-mono">
                <span className="text-[11px] text-slate-500">预计总回款</span>
                <span className="font-bold text-orange-600">
                  +¥{(sellQuantity * sellUnitPrice).toLocaleString()} 玲玉币
                </span>
              </div>

              <button
                type="submit"
                disabled={(Number(myStockpiles[sellEquipmentId]) || 0) <= 0 || sellQuantity <= 0}
                className="w-full py-2 bg-slate-900 hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded transition-colors cursor-pointer"
              >
                确认挂单并推向市场
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 3: 我的订单 (My Active Listings) */}
        {activeSubTab === 'my_listings' && (
          <motion.div
            key="my-listings-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-600">
                本国在售挂单 ({myListings.length})
              </span>
              <button
                type="button"
                onClick={() => setActiveSubTab('sell')}
                className="text-xs text-orange-600 hover:underline cursor-pointer"
              >
                + 追加新挂单
              </button>
            </div>

            {myListings.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <Layers className="w-7 h-7 mx-auto stroke-1 text-slate-300" />
                <p>本国当前暂无在售军火挂单</p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('sell')}
                  className="text-xs text-orange-600 hover:underline cursor-pointer"
                >
                  去上架第一批军火
                </button>
              </div>
            ) : (
              <div className="border-t border-b border-slate-200 divide-y divide-slate-100 text-xs">
                {myListings.map((listing) => (
                  <div key={listing.id} className="py-2.5 px-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        {renderEquipmentTacticalIcon(listing.equipmentId, { className: 'w-4 h-4 text-slate-700' })}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{listing.equipmentName}</span>
                          <span className="text-[10px] text-emerald-700 font-mono">在售</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          已售出: {listing.soldCount || 0} 件
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 text-right font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">单价</span>
                        <span className="font-bold text-orange-600">
                          ¥{listing.unitPriceLingyu}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">剩余</span>
                        <span className="text-slate-800">
                          {listing.availableQuantity.toLocaleString()}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelListing(listing.id)}
                        className="text-slate-400 hover:text-red-600 text-xs transition-colors cursor-pointer"
                      >
                        下架撤回
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 4: 走廊勘测 (Corridor Simulator) */}
        {activeSubTab === 'corridor' && (
          <motion.div
            key="corridor-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto space-y-4 py-2"
          >
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  陆上地缘贸易走廊实测
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  基于省份拓扑图检验本国与目标国之间的陆路通达性与封锁断点
                </p>
              </div>

              {/* Country Picker */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 shrink-0">目标国:</span>
                <select
                  value={corridorTargetNationId}
                  onChange={(e) => setCorridorTargetNationId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none"
                >
                  {allNations
                    .filter((n) => n.id !== myNation?.id)
                    .map((nat) => (
                      <option key={nat.id} value={nat.id}>
                        {nat.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Corridor Result */}
            {corridorVerification && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        corridorVerification.canTrade ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-bold text-slate-900">
                      {corridorVerification.canTrade ? '陆上走廊畅通 · 具备通商条件' : '陆上走廊阻断 · 无法通商'}
                    </span>
                  </div>

                  {corridorVerification.canTrade && (
                    <span className="font-mono text-slate-500 text-[11px]">
                      安全评级: {corridorVerification.securityScore}%
                    </span>
                  )}
                </div>

                <p className="text-slate-600 leading-relaxed">
                  {corridorVerification.summaryText}
                </p>

                {!corridorVerification.canTrade && (
                  <div className="text-red-700 text-xs py-1 border-t border-red-100">
                    <strong>阻断原因：</strong> {corridorVerification.blockageReason}
                  </div>
                )}

                {/* Waypoint Steps */}
                {corridorVerification.waypoints.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-mono text-slate-400 block">
                      途经省份节点 ({corridorVerification.waypoints.length} 站):
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
                      {corridorVerification.waypoints.map((wp, idx) => {
                        const isOrigin = idx === 0;
                        const isDest = idx === corridorVerification.waypoints.length - 1;

                        return (
                          <React.Fragment key={wp.provinceId + idx}>
                            <div
                              className={`px-2 py-1 rounded text-[11px] shrink-0 border ${
                                isOrigin
                                  ? 'bg-orange-50 border-orange-200 text-orange-900 font-bold'
                                  : isDest
                                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span>{wp.chineseName || wp.provinceName}</span>
                              <span className="text-[9px] text-slate-400 block font-normal">
                                {wp.ownerNationName || '缓冲区'}
                              </span>
                            </div>
                            {!isDest && <span className="text-slate-300">→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 5: 交易记录 (History Table) */}
        {activeSubTab === 'history' && (
          <motion.div
            key="history-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-600">
                军火贸易流水记录 ({transactions.length})
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <History className="w-7 h-7 mx-auto stroke-1 text-slate-300" />
                <p>暂无军火贸易流水记录</p>
              </div>
            ) : (
              <div className="border-t border-b border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-slate-400 border-b border-slate-100 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-2">时间</th>
                      <th className="py-2.5 px-2">买方 ← 卖方</th>
                      <th className="py-2.5 px-2">装备型号</th>
                      <th className="py-2.5 px-2 text-right">数量</th>
                      <th className="py-2.5 px-2 text-right">玲玉币总额</th>
                      <th className="py-2.5 px-2 text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-semibold text-slate-900">{tx.buyerNationName}</span>
                          <span className="text-slate-400 mx-1">←</span>
                          <span className="text-slate-600">{tx.sellerNationName}</span>
                        </td>
                        <td className="py-2.5 px-2 font-sans font-medium text-slate-900">
                          {tx.equipmentName}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {tx.quantity.toLocaleString()} 件
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-orange-600">
                          ¥{tx.totalCostLingyu.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className="text-[10px] text-emerald-700">
                            交付完成
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Purchase Confirmation Modal */}
      <AnimatePresence>
        {purchasingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white border border-slate-200 rounded w-full max-w-sm p-4 shadow-lg space-y-3.5 text-slate-800"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">军火采购确认</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    供方：{purchasingListing.sellerNationName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPurchasingListing(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Equipment Item Preview */}
              <div className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0">
                    {renderEquipmentTacticalIcon(purchasingListing.equipmentId, { className: 'w-3.5 h-3.5 text-slate-700' })}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">
                      {purchasingListing.equipmentName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      单价: ¥{purchasingListing.unitPriceLingyu}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  可用: {purchasingListing.availableQuantity.toLocaleString()}
                </span>
              </div>

              {/* Quantity Picker */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>采购数量</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    起订: {purchasingListing.minBatch} 件
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={purchasingListing.minBatch}
                    max={purchasingListing.availableQuantity}
                    value={purchaseQuantity}
                    onChange={(e) =>
                      setPurchaseQuantity(
                        Math.min(purchasingListing.availableQuantity, Math.max(1, Number(e.target.value) || 1))
                      )
                    }
                    className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-slate-400"
                  />
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    {[100, 500, 1000, purchasingListing.availableQuantity].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPurchaseQuantity(Math.min(purchasingListing.availableQuantity, preset))}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded"
                      >
                        {preset === purchasingListing.availableQuantity ? '全购' : preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Land Route Check Badge */}
              {currentPurchaseVerification && (
                <div className="py-1 text-xs flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentPurchaseVerification.canTrade ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span
                    className={`font-mono text-[11px] ${
                      currentPurchaseVerification.canTrade ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {currentPurchaseVerification.canTrade ? '陆上走廊畅通' : '走廊受阻，不可交付'}
                  </span>
                </div>
              )}

              {/* Total Cost Statement */}
              <div className="py-2 border-t border-b border-slate-100 flex items-baseline justify-between font-mono">
                <span className="text-xs text-slate-500">应付玲玉币</span>
                <span className="text-base font-bold text-orange-600">
                  ¥{(purchasingListing.unitPriceLingyu * purchaseQuantity).toLocaleString()}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPurchasingListing(null)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={
                    !currentPurchaseVerification?.canTrade ||
                    myTreasuryInLingyu < purchasingListing.unitPriceLingyu * purchaseQuantity
                  }
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  确认采购
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
