export function generateJamCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
}

export function formatJamLink(code: string): string {
    return `${window.location.origin}/jam/${code}`;
}

export function validateJamCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}
