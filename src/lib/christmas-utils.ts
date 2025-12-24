const CHRISTMAS_MODAL_KEY = 'christmas-hat-modal-dismissed-2025';

export function isChristmasEvent(): boolean {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    const day = now.getDate();

    return year === 2025 && month === 11 && day >= 23 && day <= 25;
}

export function hasUserDismissedChristmasModal(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(CHRISTMAS_MODAL_KEY) === 'true';
}

export function dismissChristmasModal(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CHRISTMAS_MODAL_KEY, 'true');
}
