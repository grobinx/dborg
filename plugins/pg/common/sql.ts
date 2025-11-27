
const tableIOStats = (): string => {
    return `
        select
            heap_blks_read,
            heap_blks_hit,
            round(100.0 * heap_blks_hit / nullif(heap_blks_hit + heap_blks_read, 0), 2) as heap_hit_ratio,
            idx_blks_read,
            idx_blks_hit,
            round(100.0 * idx_blks_hit / nullif(idx_blks_hit + idx_blks_read, 0), 2) as idx_hit_ratio,
            toast_blks_read,
            toast_blks_hit,
            round(100.0 * toast_blks_hit / nullif(toast_blks_hit + toast_blks_read, 0), 2) as toast_hit_ratio,
            tidx_blks_read,
            tidx_blks_hit,
            round(100.0 * tidx_blks_hit / nullif(tidx_blks_hit + tidx_blks_read, 0), 2) as tidx_hit_ratio
        from 
            pg_statio_all_tables
        where 
            schemaname = $1 and relname = $2;
    `;
}

export default {
    tableIOStats,
}