import { DataType } from "csstype";
import { t } from "i18next";

export type ThemeColor =
    /** Kolor główny, neutralny */
    'main'
    /** Kolor podstawowy */
    | 'primary'
    /** Kolor drugorzędny */
    | 'secondary'
    /** Kolor błędu */
    | 'error'
    /** Kolor ostrzeżenia */
    | 'warning'
    /** Kolor informacji */
    | 'info'
    /** Kolor sukcesu */
    | 'success'
    ;

export const themeColors: ThemeColor[] = [
    'main',
    'primary',
    'secondary',
    'error',
    'warning',
    'info',
    'success',
]

export const htmlColors: DataType.NamedColor[] = [
    "aliceblue",
    "antiquewhite",
    "aqua",
    "aquamarine",
    "azure",
    "beige",
    "bisque",
    "black",
    "blanchedalmond",
    "blue",
    "blueviolet",
    "brown",
    "burlywood",
    "cadetblue",
    "chartreuse",
    "chocolate",
    "coral",
    "cornflowerblue",
    "cornsilk",
    "crimson",
    "cyan",
    "darkblue",
    "darkcyan",
    "darkgoldenrod",
    "darkgray",
    "darkgreen",
    "darkgrey",
    "darkkhaki",
    "darkmagenta",
    "darkolivegreen",
    "darkorange",
    "darkorchid",
    "darkred",
    "darksalmon",
    "darkseagreen",
    "darkslateblue",
    "darkslategray",
    "darkslategrey",
    "darkturquoise",
    "darkviolet",
    "deeppink",
    "deepskyblue",
    "dimgray",
    "dimgrey",
    "dodgerblue",
    "firebrick",
    "floralwhite",
    "forestgreen",
    "fuchsia",
    "gainsboro",
    "ghostwhite",
    "gold",
    "goldenrod",
    "gray",
    "green",
    "greenyellow",
    "grey",
    "honeydew",
    "hotpink",
    "indianred",
    "indigo",
    "ivory",
    "khaki",
    "lavender",
    "lavenderblush",
    "lawngreen",
    "lemonchiffon",
    "lightblue",
    "lightcoral",
    "lightcyan",
    "lightgoldenrodyellow",
    "lightgray",
    "lightgreen",
    "lightgrey",
    "lightpink",
    "lightsalmon",
    "lightseagreen",
    "lightskyblue",
    "lightslategray",
    "lightslategrey",
    "lightsteelblue",
    "lightyellow",
    "lime",
    "limegreen",
    "linen",
    "magenta",
    "maroon",
    "mediumaquamarine",
    "mediumblue",
    "mediumorchid",
    "mediumpurple",
    "mediumseagreen",
    "mediumslateblue",
    "mediumspringgreen",
    "mediumturquoise",
    "mediumvioletred",
    "midnightblue",
    "mintcream",
    "mistyrose",
    "moccasin",
    "navajowhite",
    "navy",
    "oldlace",
    "olive",
    "olivedrab",
    "orange",
    "orangered",
    "orchid",
    "palegoldenrod",
    "palegreen",
    "paleturquoise",
    "palevioletred",
    "papayawhip",
    "peachpuff",
    "peru",
    "pink",
    "plum",
    "powderblue",
    "purple",
    "rebeccapurple",
    "red",
    "rosybrown",
    "royalblue",
    "saddlebrown",
    "salmon",
    "sandybrown",
    "seagreen",
    "seashell",
    "sienna",
    "silver",
    "skyblue",
    "slateblue",
    "slategray",
    "slategrey",
    "snow",
    "springgreen",
    "steelblue",
    "tan",
    "teal",
    "thistle",
    "tomato",
    "turquoise",
    "violet",
    "wheat",
    "white",
    "whitesmoke",
    "yellow",
    "yellowgreen"
];

export const htmlColorWords: string[] = [
    "alice", "blue", "antique", "white", "aqua", "marine", "azure", "beige", "bisque", "black",
    "blanched", "almond", "violet", "brown", "burly", "wood", "cadet", "chartreuse", "chocolate",
    "coral", "corn", "flower", "silk", "crimson", "cyan", "dark", "golden", "rod", "gray", "green",
    "grey", "khaki", "magenta", "olive", "orange", "orchid", "red", "salmon", "sea", "slate",
    "turquoise", "pink", "deep", "sky", "dim", "dodger", "fire", "brick", "floral", "forest",
    "fuchsia", "gainsboro", "ghost", "gold", "honey", "dew", "hot", "indian", "indigo",
    "ivory", "lavender", "blush", "lawn", "lemon", "chiffon", "light", "steel", "mint", "cream",
    "misty", "rose", "moccasin", "navajo", "navy", "old", "lace", "drab", "pale", "papaya", "whip",
    "peach", "puff", "peru", "plum", "powder", "purple", "rebecca", "rosy", "royal", "saddle",
    "sand", "shell", "sienna", "silver", "snow", "spring", "tan", "teal", "thistle", "tomato",
    "wheat", "white", "smoke", "yellow", "medium", "midnight", "lime"
].sort((a, b) => b.length - a.length);

export function labelColor(color: string): string {
    let rest = color.toLowerCase();
    const found: string[] = [];

    while (rest.length > 0) {
        let matched = false;
        for (const word of htmlColorWords) {
            if (rest.startsWith(word)) {
                const transition = t(`colors.${word}`, word);
                found.push(transition.charAt(0).toUpperCase() + transition.slice(1));
                rest = rest.slice(word.length);
                matched = true;
                break;
            }
        }
        if (!matched) {
            found.push(rest.charAt(0).toUpperCase() + rest.slice(1));
            break;
        }
    }
    return found.join(' ');
}

