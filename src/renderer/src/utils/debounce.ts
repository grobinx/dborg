
function debounce(fn: () => void, delay: number): () => void {
    let timer: NodeJS.Timeout | null = null;
    return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fn, delay);
    };
}

export default debounce;