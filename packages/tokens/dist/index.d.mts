declare const Palette: {
    readonly mocha: {
        readonly 400: "#D9BFA0";
        readonly 500: "#A69677";
        readonly 700: "#BF8A49";
        readonly 900: "#403B33";
    };
    readonly cloud: {
        readonly 50: "#F5F1EB";
        readonly 100: "#E8E6E1";
        readonly 200: "#D9D7D2";
        readonly 900: "#0D0D0D";
    };
    readonly espresso: {
        readonly 900: "#403B33";
    };
    readonly doechii: {
        readonly 1: "#122611";
        readonly 2: "#BF8A49";
        readonly 3: "#D9B89C";
        readonly 4: "#8C3D20";
        readonly 5: "#401309";
    };
    readonly sage: {
        readonly 50: "#F8F4EF";
        readonly 100: "#F1E8DC";
        readonly 200: "#E4D1BC";
        readonly 400: "#D2A676";
        readonly 500: "#BF8A49";
        readonly 600: "#A6783F";
        readonly 700: "#8D6636";
    };
    readonly relationship: {
        readonly friendly: "#7A8C6F";
        readonly hostile: "#9C4A3F";
        readonly romance: "#B38B82";
        readonly family: "#4F5861";
        readonly neutral: "#A69677";
    };
    readonly status: {
        readonly success: "#5B7B4B";
        readonly warning: "#BF8A49";
        readonly error: "#A33A3A";
        readonly info: "#4B7D7D";
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
        readonly primary: "#A69677";
        readonly secondary: "#E8E6E1";
        readonly accent: "#BF8A49";
    };
    readonly bg: {
        readonly canvas: "#F5F1EB";
        readonly card: "#FFFFFF";
        readonly overlay: "rgba(0, 0, 0, 0.4)";
    };
    readonly text: {
        readonly base: "#403B33";
        readonly muted: "#BF8A49";
        readonly inverted: "#F5F1EB";
    };
    readonly border: {
        readonly default: "#D9D7D2";
        readonly focused: "#A69677";
        readonly error: "#A33A3A";
    };
    readonly status: {
        readonly success: "#5B7B4B";
        readonly warning: "#BF8A49";
        readonly error: "#A33A3A";
        readonly info: "#4B7D7D";
    };
    readonly param: {
        readonly foreshadowing: "#BF8A49";
        readonly relationship: {
            readonly friendly: "#7A8C6F";
            readonly hostile: "#9C4A3F";
            readonly romance: "#B38B82";
            readonly family: "#4F5861";
            readonly neutral: "#A69677";
        };
    };
};
declare const Tokens: {
    palette: {
        readonly mocha: {
            readonly 400: "#D9BFA0";
            readonly 500: "#A69677";
            readonly 700: "#BF8A49";
            readonly 900: "#403B33";
        };
        readonly cloud: {
            readonly 50: "#F5F1EB";
            readonly 100: "#E8E6E1";
            readonly 200: "#D9D7D2";
            readonly 900: "#0D0D0D";
        };
        readonly espresso: {
            readonly 900: "#403B33";
        };
        readonly doechii: {
            readonly 1: "#122611";
            readonly 2: "#BF8A49";
            readonly 3: "#D9B89C";
            readonly 4: "#8C3D20";
            readonly 5: "#401309";
        };
        readonly sage: {
            readonly 50: "#F8F4EF";
            readonly 100: "#F1E8DC";
            readonly 200: "#E4D1BC";
            readonly 400: "#D2A676";
            readonly 500: "#BF8A49";
            readonly 600: "#A6783F";
            readonly 700: "#8D6636";
        };
        readonly relationship: {
            readonly friendly: "#7A8C6F";
            readonly hostile: "#9C4A3F";
            readonly romance: "#B38B82";
            readonly family: "#4F5861";
            readonly neutral: "#A69677";
        };
        readonly status: {
            readonly success: "#5B7B4B";
            readonly warning: "#BF8A49";
            readonly error: "#A33A3A";
            readonly info: "#4B7D7D";
        };
        readonly common: {
            readonly white: "#FFFFFF";
            readonly black: "#0D0D0D";
            readonly transparent: "transparent";
        };
    };
    semantic: {
        readonly brand: {
            readonly primary: "#A69677";
            readonly secondary: "#E8E6E1";
            readonly accent: "#BF8A49";
        };
        readonly bg: {
            readonly canvas: "#F5F1EB";
            readonly card: "#FFFFFF";
            readonly overlay: "rgba(0, 0, 0, 0.4)";
        };
        readonly text: {
            readonly base: "#403B33";
            readonly muted: "#BF8A49";
            readonly inverted: "#F5F1EB";
        };
        readonly border: {
            readonly default: "#D9D7D2";
            readonly focused: "#A69677";
            readonly error: "#A33A3A";
        };
        readonly status: {
            readonly success: "#5B7B4B";
            readonly warning: "#BF8A49";
            readonly error: "#A33A3A";
            readonly info: "#4B7D7D";
        };
        readonly param: {
            readonly foreshadowing: "#BF8A49";
            readonly relationship: {
                readonly friendly: "#7A8C6F";
                readonly hostile: "#9C4A3F";
                readonly romance: "#B38B82";
                readonly family: "#4F5861";
                readonly neutral: "#A69677";
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
