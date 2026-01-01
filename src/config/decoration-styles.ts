export const DECORATION_STYLES: Record<string, string> = {
    'Santa Hat': "absolute left-1/2 top-0 -translate-x-[60%] -translate-y-[32%] -rotate-[8deg] w-[180%] aspect-square pointer-events-none z-20",
    '10 Hours Listener': "absolute inset-0 w-[150%] h-[150%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20",
    'Bizarre Listener': "absolute top-0 right-0 w-[60%] aspect-square -translate-y-[30%] translate-x-[30%] pointer-events-none z-20",
    'UFC Belt': "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[28%] w-[285%] aspect-[2/1] pointer-events-none z-20",
    'New Year 2026': "absolute inset-0 w-[140%] h-[140%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 animate-pulse",
    'Siff Dog': "absolute bottom-0 right-0 w-[90%] aspect-square translate-x-[50%] translate-y-[40%] pointer-events-none z-20",
    'Darksign': "absolute inset-0 w-[186%] h-[200%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-[56%] pointer-events-none z-20",
};

export const DECORATION_FILTERS: Record<string, string> = {
    'Darksign': 'brightness(0) saturate(100%) invert(27%) sepia(98%) saturate(3500%) hue-rotate(350deg) brightness(95%) contrast(90%)',
};

export const DEFAULT_DECORATION_STYLE = "absolute inset-0 w-[125%] h-[125%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20";
