import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { CropData } from '@/types/profile-customization';

interface ImageCropperModalProps {
    imageUrl: string;
    aspectRatio: number;
    initialCrop?: CropData | null;
    onSave: (cropData: CropData) => void;
    onCancel: () => void;
    isOpen: boolean;
    title?: string;
}

export default function ImageCropperModal({
    imageUrl,
    aspectRatio,
    initialCrop,
    onSave,
    onCancel,
    isOpen,
    title = 'Adjust Image'
}: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: initialCrop?.x || 0, y: initialCrop?.y || 0 });
    const [zoom, setZoom] = useState(initialCrop?.zoom || 1);
    const [centerPercentage, setCenterPercentage] = useState({ x: 50, y: 50 });

    useEffect(() => {
        if (isOpen) {
            setCrop({ x: initialCrop?.x || 0, y: initialCrop?.y || 0 });
            setZoom(initialCrop?.zoom || 1);
        }
    }, [isOpen, initialCrop]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        const centerX = croppedArea.x + croppedArea.width / 2;
        const centerY = croppedArea.y + croppedArea.height / 2;
        setCenterPercentage({ x: centerX, y: centerY });
    }, []);

    const handleSave = () => {
        onSave({
            x: crop.x,
            y: crop.y,
            zoom,
            percentage: centerPercentage
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <button onClick={onCancel} className="text-zinc-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="relative w-full h-[400px] bg-black">
                    <Cropper
                        image={imageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        objectFit="horizontal-cover"
                    />
                </div>

                <div className="p-6 space-y-4 bg-zinc-900">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Zoom
                        </label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-zinc-300 hover:text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition-colors"
                        >
                            Save Adjustment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
