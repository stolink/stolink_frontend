declare const Palette: {
    /**
     * StoLink Design System v2.0 - Vivid Warm Palette
     *
     * Color Theory Applied:
     * - Analogous Warm Harmony (Terracotta → Golden → Amber)
     * - High Saturation & Brightness for clarity on displays
     * - Strong contrast for readability
     *
     * Brand Concept: Literary IDE - "Warm Immersion for Authors"
     */
    readonly mocha: {
        readonly 400: "#E89D7A";
        readonly 500: "#D4785A";
        readonly 600: "#C4623F";
        readonly 700: "#B85A3E";
        readonly 900: "#5C3020";
    };
    readonly cloud: {
        readonly 50: "#FDFBF7";
        readonly 100: "#F8F4ED";
        readonly 200: "#EDE7DD";
        readonly 300: "#DDD4C6";
        readonly 900: "#1A1612";
    };
    readonly espresso: {
        readonly 700: "#5C4033";
        readonly 900: "#3D2B1F";
    };
    readonly doechii: {
        readonly 1: "#1E4620";
        readonly 2: "#E5A33D";
        readonly 3: "#F5D4A8";
        readonly 4: "#C95D32";
        readonly 5: "#6B2D15";
    };
    readonly sage: {
        readonly 50: "#FBFAF7";
        readonly 100: "#F3F0E8";
        readonly 200: "#E5DFD2";
        readonly 400: "#C7B99F";
        readonly 500: "#9AAF7C";
        readonly 600: "#7D9360";
        readonly 700: "#5E7345";
    };
    readonly relationship: {
        readonly friendly: "#4CAF50";
        readonly hostile: "#F44336";
        readonly romance: "#E91E63";
        readonly family: "#5C6BC0";
        readonly neutral: "#90A4AE";
    };
    readonly status: {
        readonly success: "#10B981";
        readonly warning: "#F59E0B";
        readonly error: "#EF4444";
        readonly info: "#3B82F6";
    };
    readonly common: {
        readonly white: "#FFFFFF";
        readonly black: "#1A1612";
        readonly transparent: "transparent";
    };
};
type PaletteType = typeof Palette;

declare const Semantic: {
    readonly brand: {
        readonly primary: "#D4785A";
        readonly secondary: "#F8F4ED";
        readonly accent: "#9AAF7C";
    };
    readonly bg: {
        readonly canvas: "#FDFBF7";
        readonly card: "#FFFFFF";
        readonly overlay: "rgba(0, 0, 0, 0.4)";
    };
    readonly text: {
        readonly base: "#3D2B1F";
        readonly muted: "#B85A3E";
        readonly inverted: "#FDFBF7";
    };
    readonly border: {
        readonly default: "#EDE7DD";
        readonly focused: "#D4785A";
        readonly error: "#EF4444";
    };
    readonly status: {
        readonly success: "#10B981";
        readonly warning: "#F59E0B";
        readonly error: "#EF4444";
        readonly info: "#3B82F6";
    };
    readonly param: {
        readonly foreshadowing: "#9AAF7C";
        readonly relationship: {
            readonly friendly: "#4CAF50";
            readonly hostile: "#F44336";
            readonly romance: "#E91E63";
            readonly family: "#5C6BC0";
            readonly neutral: "#90A4AE";
        };
    };
};
declare const Tokens: {
    palette: {
        readonly mocha: {
            readonly 400: "#E89D7A";
            readonly 500: "#D4785A";
            readonly 600: "#C4623F";
            readonly 700: "#B85A3E";
            readonly 900: "#5C3020";
        };
        readonly cloud: {
            readonly 50: "#FDFBF7";
            readonly 100: "#F8F4ED";
            readonly 200: "#EDE7DD";
            readonly 300: "#DDD4C6";
            readonly 900: "#1A1612";
        };
        readonly espresso: {
            readonly 700: "#5C4033";
            readonly 900: "#3D2B1F";
        };
        readonly doechii: {
            readonly 1: "#1E4620";
            readonly 2: "#E5A33D";
            readonly 3: "#F5D4A8";
            readonly 4: "#C95D32";
            readonly 5: "#6B2D15";
        };
        readonly sage: {
            readonly 50: "#FBFAF7";
            readonly 100: "#F3F0E8";
            readonly 200: "#E5DFD2";
            readonly 400: "#C7B99F";
            readonly 500: "#9AAF7C";
            readonly 600: "#7D9360";
            readonly 700: "#5E7345";
        };
        readonly relationship: {
            readonly friendly: "#4CAF50";
            readonly hostile: "#F44336";
            readonly romance: "#E91E63";
            readonly family: "#5C6BC0";
            readonly neutral: "#90A4AE";
        };
        readonly status: {
            readonly success: "#10B981";
            readonly warning: "#F59E0B";
            readonly error: "#EF4444";
            readonly info: "#3B82F6";
        };
        readonly common: {
            readonly white: "#FFFFFF";
            readonly black: "#1A1612";
            readonly transparent: "transparent";
        };
    };
    semantic: {
        readonly brand: {
            readonly primary: "#D4785A";
            readonly secondary: "#F8F4ED";
            readonly accent: "#9AAF7C";
        };
        readonly bg: {
            readonly canvas: "#FDFBF7";
            readonly card: "#FFFFFF";
            readonly overlay: "rgba(0, 0, 0, 0.4)";
        };
        readonly text: {
            readonly base: "#3D2B1F";
            readonly muted: "#B85A3E";
            readonly inverted: "#FDFBF7";
        };
        readonly border: {
            readonly default: "#EDE7DD";
            readonly focused: "#D4785A";
            readonly error: "#EF4444";
        };
        readonly status: {
            readonly success: "#10B981";
            readonly warning: "#F59E0B";
            readonly error: "#EF4444";
            readonly info: "#3B82F6";
        };
        readonly param: {
            readonly foreshadowing: "#9AAF7C";
            readonly relationship: {
                readonly friendly: "#4CAF50";
                readonly hostile: "#F44336";
                readonly romance: "#E91E63";
                readonly family: "#5C6BC0";
                readonly neutral: "#90A4AE";
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
