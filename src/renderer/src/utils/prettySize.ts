
const prettySize = (value: number) => {
    if (value == null) return "";
    if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "G";
    if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return value.toString();
};

export default prettySize;