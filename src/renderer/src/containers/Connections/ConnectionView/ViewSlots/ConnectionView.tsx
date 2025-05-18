import React, { useMemo, useEffect, useState } from "react";
import { TitleConnectionViewSlot, DataGridConnectionViewSlot, IConnectionViewSlot, TextConnectionViewSlot } from "plugins/manager/renderer/Plugin";
import { ConnectionTitleViewSlot } from "./ConnectionTitleViewSlot";
import { Box } from "@mui/material";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import ConnectionDataGridViewSlot from "./ConnectionDataGridViewSlot";
import ConnectionTextViewSlot from "./CpnnectionTextViewSlot";

interface ConnectionViewProps {
    slots: IConnectionViewSlot[];
    session: IDatabaseSession;
}

export const ConnectionView: React.FC<ConnectionViewProps> = ({ slots, session }) => {
    // Zapamiętaj refy dla każdego slotu
    const slotRefs = useMemo(
        () => slots.map(() => React.createRef<HTMLDivElement>()),
        [slots]
    );

    // Stan na wysokości każdego slotu
    const [heights, setHeights] = useState<number[]>(() => slots.map(() => 0));

    // Stan do wymuszenia renderowania tekstowych i tytułowych slotów
    const [forceUpdateKey, setForceUpdateKey] = useState(0);

    useEffect(() => {
        const observers: ResizeObserver[] = [];

        slotRefs.forEach((ref, idx) => {
            if (ref.current) {
                const observer = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        setHeights(prev => {
                            const next = [...prev];
                            next[idx] = entry.contentRect.height;
                            return next;
                        });
                    }
                });
                observer.observe(ref.current);
                observers.push(observer);
            }
        });

        return () => {
            observers.forEach(observer => observer.disconnect());
        };
    }, [slotRefs]);

    // Wyznacz sumę wysokości slotów innych niż datagrid
    const otherSlotsHeight = heights.reduce((sum, h, idx) => {
        if (slots[idx].type !== "datagrid") return sum + h;
        return sum;
    }, 0);

    // Funkcja do wymuszenia renderowania
    const forceRerenderSlots = () => setForceUpdateKey(k => k + 1);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {slots.map((slot, idx) => {
                switch (slot.type) {
                    case "title":
                        return (
                            <ConnectionTitleViewSlot
                                key={slot.id + "_" + forceUpdateKey}
                                slot={slot as TitleConnectionViewSlot}
                                session={session}
                                ref={slotRefs[idx]}
                            />
                        );
                    case "datagrid":
                        return (
                            <Box
                                key={slot.id}
                                ref={slotRefs[idx]}
                                sx={{
                                    width: "100%",
                                    flex: 1,
                                    minHeight: 0,
                                    height: `calc(100% - ${otherSlotsHeight}px)`,
                                    transition: "height 0.2s"
                                }}
                            >
                                <ConnectionDataGridViewSlot
                                    slot={slot as DataGridConnectionViewSlot}
                                    session={session}
                                    onRowClick={(row) => {
                                        (slot as DataGridConnectionViewSlot).onRowClick?.(row);
                                        forceRerenderSlots();
                                    }}
                                />
                            </Box>
                        );
                    case "text":
                        return (
                            <ConnectionTextViewSlot
                                key={slot.id + "_" + forceUpdateKey}
                                slot={slot as TextConnectionViewSlot}
                                session={session}
                                ref={slotRefs[idx]}
                            />
                        );
                    default:
                        return null;
                }
            })}
        </Box>
    );
};

export default ConnectionView;

