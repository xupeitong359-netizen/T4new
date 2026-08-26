import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
 X,
 Crop,
 ZoomIn,
 ZoomOut,
 RotateCw,
 FlipHorizontal,
 Maximize2,
 Check,
 Sparkles,
 RefreshCw,
 Move,
 Info,
} from 'lucide-react';

interface FlagCropperModalProps {
 isOpen: boolean;
 imageSrc: string | null;
 onClose: () => void;
 onCropComplete: (croppedDataUrl: string) => void;
 title?: string;
 reasonNotice?: string;
}

export const FlagCropperModal: React.FC<FlagCropperModalProps> = ({
 isOpen,
 imageSrc,
 onClose,
 onCropComplete,
 title = '国旗 4:3 规格裁切',
 reasonNotice,
}) => {
 const [scale, setScale] = useState(1);
 const [position, setPosition] = useState({ x: 0, y: 0 });
 const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
 const [isFlippedH, setIsFlippedH] = useState(false);
 const [isDragging, setIsDragging] = useState(false);
 const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
 const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

 const containerRef = useRef<HTMLDivElement>(null);
 const imageRef = useRef<HTMLImageElement>(null);

 // Target aspect ratio: 4:3 (width:height = 4/3 = 1.33333)
 const TARGET_RATIO = 4 / 3;
 const CROP_BOX_WIDTH = 360; // Width in px for preview
 const CROP_BOX_HEIGHT = CROP_BOX_WIDTH / TARGET_RATIO; // 270px

 // Calculate fitted base dimensions
 const baseSize = useMemo(() => {
  if (!originalDimensions) return { width: CROP_BOX_WIDTH, height: CROP_BOX_HEIGHT };
  const { width: nw, height: nh } = originalDimensions;
  if (!nw || !nh) return { width: CROP_BOX_WIDTH, height: CROP_BOX_HEIGHT };
  const imgRatio = nw / nh;
  if (imgRatio >= TARGET_RATIO) {
   // Wider than 4:3 -> match height, let width overflow
   return {
    width: Math.round(CROP_BOX_HEIGHT * imgRatio),
    height: CROP_BOX_HEIGHT,
   };
  } else {
   // Taller than 4:3 -> match width, let height overflow
   return {
    width: CROP_BOX_WIDTH,
    height: Math.round(CROP_BOX_WIDTH / imgRatio),
   };
  }
 }, [originalDimensions, CROP_BOX_WIDTH, CROP_BOX_HEIGHT, TARGET_RATIO]);

 // Reset and auto-fit when image changes or modal opens
 useEffect(() => {
  if (isOpen && imageSrc) {
   const img = new Image();
   img.onload = () => {
    setOriginalDimensions({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setIsFlippedH(false);
   };
   img.src = imageSrc;
  }
 }, [isOpen, imageSrc]);

 // Pointer drag handlers for panning
 const handlePointerDown = (e: React.PointerEvent) => {
  e.preventDefault();
  setIsDragging(true);
  setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
 };

 const handlePointerMove = (e: React.PointerEvent) => {
  if (!isDragging) return;
  setPosition({
   x: e.clientX - dragStart.x,
   y: e.clientY - dragStart.y,
  });
 };

 const handlePointerUp = (e: React.PointerEvent) => {
  setIsDragging(false);
  try {
   (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  } catch {
   // ignore
  }
 };

 // Wheel zoom
 const handleWheel = (e: React.WheelEvent) => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.08 : -0.08;
  setScale((prev) => Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))));
 };

 // Rotate clockwise
 const handleRotate = () => {
  setRotation((prev) => (prev + 90) % 360);
 };

 // Flip horizontal
 const handleFlip = () => {
  setIsFlippedH((prev) => !prev);
 };

 // Center fit
 const handleReset = () => {
  setScale(1);
  setPosition({ x: 0, y: 0 });
  setRotation(0);
  setIsFlippedH(false);
 };

 // Render cropped image to high-res canvas (1000 x 750 px standard 4:3)
 const handleCrop = () => {
  if (!imageSrc) return;

  const outputWidth = 1000;
  const outputHeight = 750;

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const multiplier = outputWidth / CROP_BOX_WIDTH;
  const drawW = baseSize.width * multiplier;
  const drawH = baseSize.height * multiplier;

  const renderImg = new Image();
  renderImg.crossOrigin = 'anonymous';
  renderImg.onload = () => {
   ctx.save();
   // Center of canvas
   ctx.translate(outputWidth / 2, outputHeight / 2);

   // Translations in output space
   ctx.translate(position.x * multiplier, position.y * multiplier);

   // Rotation
   ctx.rotate((rotation * Math.PI) / 180);

   // Horizontal flip
   if (isFlippedH) {
    ctx.scale(-1, 1);
   }

   // Zoom Scale
   ctx.scale(scale, scale);

   // Draw image centered
   ctx.drawImage(
    renderImg,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH
   );

   ctx.restore();

   try {
    const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
    if (croppedDataUrl && croppedDataUrl.length > 50) {
     onCropComplete(croppedDataUrl);
     onClose();
    }
   } catch (err) {
    console.error('Failed to export canvas:', err);
   }
  };
  renderImg.src = imageSrc;
 };

 if (!isOpen || !imageSrc) return null;

 const currentRatioText = originalDimensions
  ? `${originalDimensions.width} × ${originalDimensions.height} (${(
    originalDimensions.width / originalDimensions.height
   ).toFixed(2)} : 1)`
  : '';

 return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn select-none">
   <div
    id="flag-cropper-modal"
    className="w-full max-w-lg my-auto bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100 flex flex-col max-h-[95vh]"
   >
    {/* Header */}
    <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0 bg-slate-900/90">
     <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
       <Crop className="w-4 h-4" />
      </div>
      <div className="min-w-0">
       <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
        <span>{title}</span>
        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
         4:3 比例
        </span>
       </h3>
       <p className="text-[11px] text-slate-400 truncate">
        {reasonNotice || '国旗标准规格要求为 4:3。请拖动或缩放以框选最佳范围'}
       </p>
      </div>
     </div>

     <button
      type="button"
      onClick={onClose}
      className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
      title="取消"
     >
      <X className="w-5 h-5" />
     </button>
    </div>

    {/* Notice Badge */}
    {originalDimensions && (
     <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5">
       <Info className="w-3.5 h-3.5 text-amber-400" />
       <span>原图尺寸：{currentRatioText}</span>
      </span>
      <span className="text-amber-400 font-medium">目标输出：1000 × 750 px</span>
     </div>
    )}

    {/* Center Interactive Cropping Stage */}
    <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/90 overflow-hidden relative min-h-[380px]">
     {/* 3:4 Crop Box Frame with Mask */}
     <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative cursor-move overflow-hidden rounded-xl border-2 border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.25)] touch-none flex items-center justify-center bg-slate-900"
      style={{
       width: `${CROP_BOX_WIDTH}px`,
       height: `${CROP_BOX_HEIGHT}px`,
      }}
     >
      {/* The Manipulated Image */}
      <img
       ref={imageRef}
       src={imageSrc}
       alt="Crop target"
       draggable={false}
       className="pointer-events-none transition-transform duration-75 ease-out select-none"
       style={{
        width: `${baseSize.width}px`,
        height: `${baseSize.height}px`,
        minWidth: `${baseSize.width}px`,
        minHeight: `${baseSize.height}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale}) rotate(${rotation}deg) ${
         isFlippedH ? 'scaleX(-1)' : ''
        }`,
        transformOrigin: 'center center',
        willChange: 'transform',
       }}
      />

      {/* Rule of Thirds & Flag Alignment Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
       <div className="border-r border-b border-white/20" />
       <div className="border-r border-b border-white/20" />
       <div className="border-b border-white/20" />
       <div className="border-r border-b border-white/20" />
       <div className="border-r border-b border-white/20" />
       <div className="border-b border-white/20" />
       <div className="border-r border-white/20" />
       <div className="border-r border-white/20" />
       <div />
      </div>

      {/* Corner Decorative Brackets */}
      <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

      {/* Drag hint overlay */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/90 font-medium pointer-events-none flex items-center gap-1 border border-white/10">
       <Move className="w-3 h-3 text-amber-400" />
       <span>可按住拖拽或滚轮缩放</span>
      </div>
     </div>
    </div>

    {/* Cropper Toolbar Controls */}
    <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3.5">
     {/* Zoom Slider */}
     <div className="flex items-center gap-3">
      <button
       type="button"
       onClick={() => setScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
       className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
       title="缩小"
      >
       <ZoomOut className="w-4 h-4" />
      </button>

      <input
       type="range"
       min="0.4"
       max="3.0"
       step="0.05"
       value={scale}
       onChange={(e) => setScale(parseFloat(e.target.value))}
       className="flex-1 accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
      />

      <button
       type="button"
       onClick={() => setScale((prev) => Math.min(3.0, Number((prev + 0.1).toFixed(2))))}
       className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
       title="放大"
      >
       <ZoomIn className="w-4 h-4" />
      </button>

      <span className="text-xs font-mono font-bold text-amber-400 min-w-[3rem] text-right">
       {(scale * 100).toFixed(0)}%
      </span>
     </div>

     {/* Action Buttons: Rotate, Flip, Reset */}
     <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
       <button
        type="button"
        onClick={handleRotate}
        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
        title="顺时针旋转90°"
       >
        <RotateCw className="w-3.5 h-3.5 text-amber-400" />
        <span>旋转 90°</span>
       </button>

       <button
        type="button"
        onClick={handleFlip}
        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
        title="水平镜像翻转"
       >
        <FlipHorizontal className="w-3.5 h-3.5 text-indigo-400" />
        <span>镜像翻转</span>
       </button>

       <button
        type="button"
        onClick={handleReset}
        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
        title="重置位置与缩放"
       >
        <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
        <span>居中重置</span>
       </button>
      </div>

      {/* Confirm / Cancel */}
      <div className="flex items-center gap-2 ml-auto">
       <button
        type="button"
        onClick={onClose}
        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
       >
        取消
       </button>

       <button
        type="button"
        onClick={handleCrop}
        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
       >
        <Check className="w-4 h-4 text-slate-950" />
        <span>确定裁切 (4:3)</span>
       </button>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};
