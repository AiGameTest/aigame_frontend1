import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface CropValues {
  cropX: number;
  cropY: number;
  cropWidth: number;
}

interface Props {
  imageUrl: string;
  initialCrop?: CropValues;
  onConfirm: (values: CropValues) => void;
  onClose: () => void;
}

export function ThumbnailCropModal({ imageUrl, initialCrop, onConfirm, onClose }: Props) {
  const initialZoom = initialCrop?.cropWidth ? Math.min(3, Math.max(1, 1 / initialCrop.cropWidth)) : 1;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom);
  const [croppedAreaPercentage, setCroppedAreaPercentage] = useState<Area | null>(
    initialCrop
      ? {
          x: initialCrop.cropX * 100,
          y: initialCrop.cropY * 100,
          width: initialCrop.cropWidth * 100,
          // Stored crop payload does not include height; width is what we persist/use.
          height: 0,
        }
      : null
  );

  const onCropComplete = useCallback((croppedAreaPct: Area) => {
    setCroppedAreaPercentage(croppedAreaPct);
  }, []);

  function handleConfirm() {
    const area = croppedAreaPercentage ?? {
      x: initialCrop?.cropX != null ? initialCrop.cropX * 100 : 0,
      y: initialCrop?.cropY != null ? initialCrop.cropY * 100 : 0,
      width: initialCrop?.cropWidth != null ? initialCrop.cropWidth * 100 : 100,
      height: 0,
    };
    onConfirm({
      cropX: area.x / 100,
      cropY: area.y / 100,
      cropWidth: area.width / 100,
    });
    onClose();
  }

  // initialCrop을 Cropper의 초기 crop/zoom으로 변환
  // (단순히 기본 중앙 크롭으로 시작; 정확한 역변환은 복잡하므로 생략)
  void initialCrop;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-dark-bg border border-dark-border rounded-xl p-5 w-full max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">썸네일 위치 조절</h2>
        <p className="text-xs text-gray-400">드래그해서 위치를 조절하고, 슬라이더로 확대/축소하세요.</p>

        <div className="relative w-full" style={{ height: 260 }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={16 / 10}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 shrink-0">확대</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-accent-pink"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-outline" onClick={onClose}>취소</button>
          <button type="button" className="btn" onClick={handleConfirm}>적용</button>
        </div>
      </div>
    </div>
  );
}
