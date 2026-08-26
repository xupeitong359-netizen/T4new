import React, { useState } from 'react';
import { getEquipmentAsset } from './militaryEquipmentVisuals';

interface TechArtProps {
 artKey: string;
 className?: string;
 isResearched?: boolean;
 isResearching?: boolean;
 isAvailable?: boolean;
 size?: 'sm' | 'md' | 'lg' | 'hero';
}

/**
 * 军事装备技术图像组件 (MILITARY EQUIPMENT ARCHIVAL ART)
 * 采用单一完整装备主体侧视图/技术图纸，严禁杂乱背景与低质简易 SVG。
 * 若无外部图片或加载失败，呈现克制严谨的专业技术图纸占位。
 */
export const MilitaryTechArt: React.FC<TechArtProps> = ({
 artKey,
 className = '',
 isResearched,
 isResearching,
 isAvailable,
 size = 'md',
}) => {
 const [imgError, setImgError] = useState(false);
 const [useBackup, setUseBackup] = useState(false);
 const asset = getEquipmentAsset(artKey);

 // 尺寸映射：装备图在科技节点中必须占据核心视觉区域 (高度 40% 以上)
 const sizeClasses = {
  sm: 'h-10 max-w-[150px]',
  md: 'h-14 sm:h-16 w-full max-w-[230px]',
  lg: 'h-24 w-full max-w-[300px]',
  hero: 'h-32 sm:h-36 w-full max-w-[380px]',
 }[size];

 // 视觉色调滤镜：根据研发状态微调
 let filterStyle = 'contrast(1.08) brightness(0.95)';
 let opacityStyle = 'opacity-95';

 if (isResearching) {
  // 研发中：微带暗金对比
  filterStyle = 'contrast(1.15) brightness(0.96) sepia(0.15)';
  opacityStyle = 'opacity-100';
 } else if (isResearched) {
  // 已列装：纯正高对比冷金属
  filterStyle = 'contrast(1.1) brightness(0.9) grayscale(0.1)';
  opacityStyle = 'opacity-100';
 } else if (!isAvailable) {
  // 未解锁：低饱和与半透明
  filterStyle = 'grayscale(0.9) contrast(0.85) brightness(1.05)';
  opacityStyle = 'opacity-35';
 }

 const currentSrc = !useBackup ? asset.imageUrl : asset.backupImageUrl || asset.imageUrl;

 return (
  <div
   className={`relative flex items-center justify-center overflow-hidden transition-all duration-150 select-none ${sizeClasses} ${className}`}
   title={`${asset.historicalModel} (${asset.eraLabel})`}
  >
   {!imgError ? (
    <img
     src={currentSrc}
     alt={asset.historicalModel}
     loading="lazy"
     referrerPolicy="no-referrer"
     onError={() => {
      if (!useBackup && asset.backupImageUrl) {
       setUseBackup(true);
      } else {
       setImgError(true);
      }
     }}
     className={`w-full h-full object-contain mix-blend-multiply transition-all duration-150 ${opacityStyle}`}
     style={{ filter: filterStyle }}
    />
   ) : (
    // 外部图片不可用时的严谨专业图纸线框占位 (绝不使用低质简易 SVG)
    <div className="w-full h-full border border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-1">
     <span className="font-mono text-[9px] text-[#475569] font-bold tracking-tight truncate w-full">
      {asset.historicalModel}
     </span>
     <span className="font-mono text-[8px] text-[#94A3B8] tracking-widest uppercase mt-0.5">
      [ 装备素材档案待接入 ]
     </span>
    </div>
   )}
  </div>
 );
};
