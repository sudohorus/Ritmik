import type * as NSFWJS from 'nsfwjs';

class NSFWValidator {
    private model: NSFWJS.NSFWJS | null = null;
    private loadingPromise: Promise<NSFWJS.NSFWJS> | null = null;
    private cache: Map<string, { isSafe: boolean; reason?: string }> = new Map();

    public preload(): void {
        if (typeof window !== 'undefined') {
            this.loadModel().catch(console.error);
        }
    }

    private async loadModel(): Promise<NSFWJS.NSFWJS> {
        if (this.model) {
            return this.model;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = (async () => {
            const nsfwjs = await import('nsfwjs');
            return nsfwjs.load();
        })();

        this.model = await this.loadingPromise;
        this.loadingPromise = null;
        return this.model;
    }

    async validateImage(url: string): Promise<{ isSafe: boolean; reason?: string }> {
        if (typeof window === 'undefined') {
            return { isSafe: true };
        }

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
            const explicitThreshold = 0.60;

            const suggestiveClasses = ['Sexy'];
            const suggestiveThreshold = 0.90;

            const unsafePrediction = predictions.find(
                (p) => {
                    if (explicitClasses.includes(p.className)) {
                        return p.probability > explicitThreshold;
                    }
                    if (suggestiveClasses.includes(p.className)) {
                        return p.probability > suggestiveThreshold;
                    }
                    return false;
                }
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
