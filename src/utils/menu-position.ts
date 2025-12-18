export const calculateMenuPosition = (buttonElement: HTMLButtonElement | null) => {
    if (!buttonElement) return {};

    const rect = buttonElement.getBoundingClientRect();

    return {
        bottom: `${window.innerHeight - rect.top + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
    };
};
