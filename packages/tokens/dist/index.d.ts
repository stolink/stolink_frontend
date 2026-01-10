declare const Palette: {
    /**
     * StoLink Design System v3.1 - Mocha & Cloud Dancer (Warm & Soft)
     *
     * Design Philosophy:
     * - Warm, soft, and premium literary aesthetic
     * - High readability (Cloud Dancer background + Espresso text)
     * - Muted brand colors (Mocha) avoiding aggressive saturation
     */
    readonly mocha: {
        readonly 50: "#FAF8F6";
        readonly 100: "#F5F0EE";
        readonly 200: "#EBE2DE";
        readonly 300: "#D6C4BC";
        readonly 400: "#BD9B8D";
        readonly 500: "#A47764";
        readonly 600: "#8E6656";
        readonly 700: "#7D5A4B";
        readonly 800: "#5C4237";
        readonly 900: "#3D302A";
    };
    readonly cloud: {
        readonly 25: "#FBFBF9";
        readonly 50: "#F1F0EC";
        readonly 100: "#E8E6E0";
        readonly 200: "#DAD7CE";
        readonly 300: "#C6C1B4";
        readonly 400: "#ABA596";
        readonly 900: "#1A1816";
    };
    readonly espresso: {
        readonly 500: "#8B736B";
        readonly 700: "#60524D";
        readonly 900: "#3D302A";
    };
    readonly sage: {
        readonly 50: "#F2F4F0";
        readonly 100: "#E3E8DE";
        readonly 200: "#CCD6C5";
        readonly 400: "#9FB38E";
        readonly 500: "#7D9668";
        readonly 600: "#647A53";
        readonly 700: "#4D5E40";
    };
    readonly relationship: {
        readonly friendly: "#5B7B4B";
        readonly hostile: "#A33A3A";
        readonly romantic: "#D67A8C";
        readonly family: "#688DB6";
        readonly neutral: "#8C96A0";
    };
    readonly status: {
        readonly success: "#5B7B4B";
        readonly warning: "#B8860B";
        readonly error: "#A33A3A";
        readonly info: "#4B7B9F";
    };
    readonly common: {
        readonly white: "#FFFFFF";
        readonly black: "#1A1816";
        readonly transparent: "transparent";
        readonly overlay: "rgba(61, 48, 42, 0.05)";
    };
};
type PaletteType = typeof Palette;

declare const Semantic: {
    readonly brand: {
        readonly primary: "#A47764";
        readonly secondary: "#E8E6E0";
        readonly accent: "#7D9668";
    };
    readonly bg: {
        readonly canvas: "#F1F0EC";
        readonly card: "#FFFFFF";
        readonly overlay: "rgba(0, 0, 0, 0.4)";
    };
    readonly text: {
        readonly base: "#3D302A";
        readonly muted: "#7D5A4B";
        readonly inverted: "#F1F0EC";
    };
    readonly border: {
        readonly default: "#DAD7CE";
        readonly focused: "#A47764";
        readonly error: "#A33A3A";
    };
    readonly status: {
        readonly success: "#5B7B4B";
        readonly warning: "#B8860B";
        readonly error: "#A33A3A";
        readonly info: "#4B7B9F";
    };
    readonly param: {
        readonly foreshadowing: "#7D9668";
        readonly relationship: {
            readonly friendly: "#5B7B4B";
            readonly hostile: "#A33A3A";
            readonly romantic: "#D67A8C";
            readonly family: "#688DB6";
            readonly neutral: "#8C96A0";
        };
    };
};
declare const Tokens: {
    palette: {
        readonly mocha: {
            readonly 50: "#FAF8F6";
            readonly 100: "#F5F0EE";
            readonly 200: "#EBE2DE";
            readonly 300: "#D6C4BC";
            readonly 400: "#BD9B8D";
            readonly 500: "#A47764";
            readonly 600: "#8E6656";
            readonly 700: "#7D5A4B";
            readonly 800: "#5C4237";
            readonly 900: "#3D302A";
        };
        readonly cloud: {
            readonly 25: "#FBFBF9";
            readonly 50: "#F1F0EC";
            readonly 100: "#E8E6E0";
            readonly 200: "#DAD7CE";
            readonly 300: "#C6C1B4";
            readonly 400: "#ABA596";
            readonly 900: "#1A1816";
        };
        readonly espresso: {
            readonly 500: "#8B736B";
            readonly 700: "#60524D";
            readonly 900: "#3D302A";
        };
        readonly sage: {
            readonly 50: "#F2F4F0";
            readonly 100: "#E3E8DE";
            readonly 200: "#CCD6C5";
            readonly 400: "#9FB38E";
            readonly 500: "#7D9668";
            readonly 600: "#647A53";
            readonly 700: "#4D5E40";
        };
        readonly relationship: {
            readonly friendly: "#5B7B4B";
            readonly hostile: "#A33A3A";
            readonly romantic: "#D67A8C";
            readonly family: "#688DB6";
            readonly neutral: "#8C96A0";
        };
        readonly status: {
            readonly success: "#5B7B4B";
            readonly warning: "#B8860B";
            readonly error: "#A33A3A";
            readonly info: "#4B7B9F";
        };
        readonly common: {
            readonly white: "#FFFFFF";
            readonly black: "#1A1816";
            readonly transparent: "transparent";
            readonly overlay: "rgba(61, 48, 42, 0.05)";
        };
    };
    semantic: {
        readonly brand: {
            readonly primary: "#A47764";
            readonly secondary: "#E8E6E0";
            readonly accent: "#7D9668";
        };
        readonly bg: {
            readonly canvas: "#F1F0EC";
            readonly card: "#FFFFFF";
            readonly overlay: "rgba(0, 0, 0, 0.4)";
        };
        readonly text: {
            readonly base: "#3D302A";
            readonly muted: "#7D5A4B";
            readonly inverted: "#F1F0EC";
        };
        readonly border: {
            readonly default: "#DAD7CE";
            readonly focused: "#A47764";
            readonly error: "#A33A3A";
        };
        readonly status: {
            readonly success: "#5B7B4B";
            readonly warning: "#B8860B";
            readonly error: "#A33A3A";
            readonly info: "#4B7B9F";
        };
        readonly param: {
            readonly foreshadowing: "#7D9668";
            readonly relationship: {
                readonly friendly: "#5B7B4B";
                readonly hostile: "#A33A3A";
                readonly romantic: "#D67A8C";
                readonly family: "#688DB6";
                readonly neutral: "#8C96A0";
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
