import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

class NSFWValidator {
    private model: nsfwjs.NSFWJS | null = null;
    private loadingPromise: Promise<nsfwjs.NSFWJS> | null = null;
    private cache: Map<string, { isSafe: boolean; reason?: string }> = new Map();

    public preload(): void {
        this.loadModel().catch(console.error);
    }

    private async loadModel(): Promise<nsfwjs.NSFWJS> {
        if (this.model) {
            return this.model;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = nsfwjs.load();
        this.model = await this.loadingPromise;
        this.loadingPromise = null;
        return this.model;
    }

    async validateImage(url: string): Promise<{ isSafe: boolean; reason?: string }> {
        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        try {
            const model = await this.loadModel();

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const predictions = await model.classify(img);

            const explicitClasses = ['Porn', 'Hentai'];
            const threshold = 0.60; 

            const unsafePrediction = predictions.find(
                (p) => explicitClasses.includes(p.className) && p.probability > threshold
            );

            let result;
            if (unsafePrediction) {
                result = {
                    isSafe: false,
                    reason: `Image detected as ${unsafePrediction.className} (${(unsafePrediction.probability * 100).toFixed(1)}% confidence)`
                };
            } else {
                result = { isSafe: true };
            }

            this.cache.set(url, result);
            return result;

        } catch (error) {
            console.warn('NSFW validation failed (likely CORS or load error), allowing image:', error);
        
            return { isSafe: true };
        }
    }
}

export const nsfwValidator = new NSFWValidator();
