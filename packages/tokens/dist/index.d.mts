declare const Palette: {
    readonly mocha: {
        readonly 400: "#C69F8F";
        readonly 500: "#A6735E";
        readonly 700: "#7D4E3C";
        readonly 900: "#4A332A";
    };
    readonly cloud: {
        readonly 50: "#F5F1EB";
        readonly 100: "#E8E6E1";
        readonly 200: "#D9D7D2";
        readonly 900: "#0D0D0D";
    };
    readonly espresso: {
        readonly 900: "#3D302A";
    };
    readonly doechii: {
        readonly 1: "#122611";
        readonly 2: "#BF8A49";
        readonly 3: "#D9B89C";
        readonly 4: "#8C3D20";
        readonly 5: "#401309";
    };
    readonly sage: {
        readonly 50: "#F9F8F6";
        readonly 100: "#F0EBE5";
        readonly 200: "#E2D8CF";
        readonly 400: "#C4B2A3";
        readonly 500: "#A47764";
        readonly 600: "#8D6652";
        readonly 700: "#755442";
    };
    readonly relationship: {
        readonly friendly: "#7A8C6F";
        readonly hostile: "#E11D48";
        readonly romance: "#DB2777";
        readonly family: "#4F5861";
        readonly neutral: "#9CA3AF";
    };
    readonly status: {
        readonly success: "#059669";
        readonly warning: "#D97706";
        readonly error: "#DC2626";
        readonly info: "#0284C7";
    };
    readonly common: {
        readonly white: "#FFFFFF";
        readonly black: "#0D0D0D";
        readonly transparent: "transparent";
    };
};
type PaletteType = typeof Palette;

declare const Semantic: {
    readonly brand: {
        readonly primary: "#A6735E";
        readonly secondary: "#E8E6E1";
        readonly accent: "#A47764";
    };
    readonly bg: {
        readonly canvas: "#F5F1EB";
        readonly card: "#FFFFFF";
        readonly overlay: "rgba(0, 0, 0, 0.4)";
    };
    readonly text: {
        readonly base: "#3D302A";
        readonly muted: "#7D4E3C";
        readonly inverted: "#F5F1EB";
    };
    readonly border: {
        readonly default: "#D9D7D2";
        readonly focused: "#A6735E";
        readonly error: "#DC2626";
    };
    readonly status: {
        readonly success: "#059669";
        readonly warning: "#D97706";
        readonly error: "#DC2626";
        readonly info: "#0284C7";
    };
    readonly param: {
        readonly foreshadowing: "#A47764";
        readonly relationship: {
            readonly friendly: "#7A8C6F";
            readonly hostile: "#E11D48";
            readonly romance: "#DB2777";
            readonly family: "#4F5861";
            readonly neutral: "#9CA3AF";
        };
    };
};
declare const Tokens: {
    palette: {
        readonly mocha: {
            readonly 400: "#C69F8F";
            readonly 500: "#A6735E";
            readonly 700: "#7D4E3C";
            readonly 900: "#4A332A";
        };
        readonly cloud: {
            readonly 50: "#F5F1EB";
            readonly 100: "#E8E6E1";
            readonly 200: "#D9D7D2";
            readonly 900: "#0D0D0D";
        };
        readonly espresso: {
            readonly 900: "#3D302A";
        };
        readonly doechii: {
            readonly 1: "#122611";
            readonly 2: "#BF8A49";
            readonly 3: "#D9B89C";
            readonly 4: "#8C3D20";
            readonly 5: "#401309";
        };
        readonly sage: {
            readonly 50: "#F9F8F6";
            readonly 100: "#F0EBE5";
            readonly 200: "#E2D8CF";
            readonly 400: "#C4B2A3";
            readonly 500: "#A47764";
            readonly 600: "#8D6652";
            readonly 700: "#755442";
        };
        readonly relationship: {
            readonly friendly: "#7A8C6F";
            readonly hostile: "#E11D48";
            readonly romance: "#DB2777";
            readonly family: "#4F5861";
            readonly neutral: "#9CA3AF";
        };
        readonly status: {
            readonly success: "#059669";
            readonly warning: "#D97706";
            readonly error: "#DC2626";
            readonly info: "#0284C7";
        };
        readonly common: {
            readonly white: "#FFFFFF";
            readonly black: "#0D0D0D";
            readonly transparent: "transparent";
        };
    };
    semantic: {
        readonly brand: {
            readonly primary: "#A6735E";
            readonly secondary: "#E8E6E1";
            readonly accent: "#A47764";
        };
        readonly bg: {
            readonly canvas: "#F5F1EB";
            readonly card: "#FFFFFF";
            readonly overlay: "rgba(0, 0, 0, 0.4)";
        };
        readonly text: {
            readonly base: "#3D302A";
            readonly muted: "#7D4E3C";
            readonly inverted: "#F5F1EB";
        };
        readonly border: {
            readonly default: "#D9D7D2";
            readonly focused: "#A6735E";
            readonly error: "#DC2626";
        };
        readonly status: {
            readonly success: "#059669";
            readonly warning: "#D97706";
            readonly error: "#DC2626";
            readonly info: "#0284C7";
        };
        readonly param: {
            readonly foreshadowing: "#A47764";
            readonly relationship: {
                readonly friendly: "#7A8C6F";
                readonly hostile: "#E11D48";
                readonly romance: "#DB2777";
                readonly family: "#4F5861";
                readonly neutral: "#9CA3AF";
            };
        };
    };
};

declare function hexToHsl(hex: string): string;
type PaletteNode = string | {
    [key: string]: PaletteNode;
};
declare function generateCSSVariables(palette: Record<string, PaletteNode>, prefix?: string): Record<string, string>;

export { Palette, type PaletteType, Semantic, Tokens, generateCSSVariables, hexToHsl };
