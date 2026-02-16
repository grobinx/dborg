import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DefaultDialogProps } from './DefaultDialogProps';
import { Button } from '@renderer/components/buttons/Button';
import { useQueryHistory } from '@renderer/contexts/QueryHistoryContext';
import { InputDecorator } from '@renderer/components/inputs/decorators/InputDecorator';
import { SearchField } from '@renderer/components/inputs/SearchField';
import { BaseList } from '@renderer/components/inputs/base/BaseList';
import { useSetting } from '@renderer/contexts/SettingsContext';
import { Ellipsis } from '@renderer/components/useful/Elipsis';
import { useSearch } from '@renderer/hooks/useSearch';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';
import { useScrollIntoView } from '@renderer/hooks/useScrollIntoView';
import * as monaco from "monaco-editor";
import { Monaco } from '@monaco-editor/react';
import MonacoEditor from '@renderer/components/editor/MonacoEditor';
import { SplitPanel, SplitPanelGroup, Splitter } from '@renderer/components/SplitPanel';

export interface QueryHistoryDialogProps extends DefaultDialogProps {
    open: boolean;
    profileName: string; // filtr po profilu
    onClose: (result: QueryHistoryDialogResult | null) => void;
}

export interface QueryHistoryDialogResult {
    query: string;
}

const QueryHistoryDialog: React.FC<QueryHistoryDialogProps> = ({ open, onClose, profileName }) => {
    const { t } = useTranslation();
    const { queryHistory } = useQueryHistory();
    const [search, setSearch] = React.useState<string>("");
    const [monospaceFontFamily] = useSetting("ui", "monospaceFontFamily");
    const [fontSize] = useSetting<number>("ui", "fontSize");
    const [editorInstance, setEditorInstance] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const itemHeight = (fontSize + 8) * 1.2;

    const [filteredHistory, highlightText] = useSearch({
        data: queryHistory,
        fields: ['qh_query'],
        searchText: search,
        filter: React.useCallback((item) => !profileName || item.qh_profile_name === profileName, [profileName]),
    });

    const [selected, setSelected, handleKeyDown] = useKeyboardNavigation(
        {
            items: React.useMemo(() => (filteredHistory || []).map((_, index) => index), [filteredHistory]),
            getId: (item) => item,
            onEnter: (item) => {
                onClose({
                    query: (filteredHistory || [])[item].qh_query,
                });
            }
        }
    );

    useScrollIntoView({
        containerId: "query-history-list",
        targetIndex: selected,
        itemSize: itemHeight,
        scrollOptions: { behavior: 'instant', block: 'nearest' },
        dependencies: [selected],
    });

    React.useEffect(() => {
        if (selected !== null && editorInstance) {
            editorInstance.setValue((filteredHistory || [])[selected]?.qh_query || "");
        }
        else {
            editorInstance?.setValue("");
        }
    }, [selected, editorInstance]);

    const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
        setEditorInstance(editor);
    }

    return (
        <Dialog
            open={open}
            onClose={() => onClose(null)}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>{t("query-history", "Query History")}</DialogTitle>

            <DialogContent sx={{ height: "60vh" }}>
                <SplitPanelGroup direction="vertical">
                    <SplitPanel>
                        <Stack
                            direction="column"
                            sx={{
                                width: "100%",
                                height: "100%",
                                overflow: "hidden",
                                gap: 8,
                                paddingBottom: 8,
                            }}
                        >
                            <InputDecorator indicator={false} disableBlink>
                                <SearchField
                                    placeholder={t("search---", "Search...")}
                                    value={search}
                                    onChange={setSearch}
                                    autoFocus
                                    onKeyDown={handleKeyDown}
                                />
                            </InputDecorator>
                            <Box
                                sx={{
                                    flex: 1,
                                    overflow: "hidden",
                                }}
                            >
                                <BaseList
                                    id="query-history-list"
                                    items={filteredHistory || []}
                                    itemHeight={itemHeight}
                                    virtual={true}
                                    renderItem={(item, _stat) => {
                                        return (
                                            <Stack
                                                sx={{
                                                    fontFamily: monospaceFontFamily,
                                                    width: "100%",
                                                    fontSize: fontSize,
                                                    paddingX: 8,
                                                }}>
                                                <Ellipsis>
                                                    {highlightText(item.qh_query)}
                                                </Ellipsis>
                                            </Stack>
                                        );
                                    }}
                                    renderEmpty={() => {
                                        return (
                                            <Typography>{t("not-found", "Not found.")}</Typography>
                                        )
                                    }}
                                    isSelected={(_, index) => index === selected}
                                    isFocused={(_, index) => index === selected}
                                    onKeyDown={handleKeyDown}
                                    onItemClick={(item) => setSelected(filteredHistory?.findIndex(i => i.qh_id === item.qh_id) ?? null)}
                                    onItemDoubleClick={(item) => {
                                        onClose({
                                            query: item.qh_query,
                                        });
                                    }}
                                    getItemId={(_, index) => `item-${index}`}
                                />
                            </Box>
                        </Stack>
                    </SplitPanel>
                    <Splitter />
                    <SplitPanel defaultSize={20}>
                        <MonacoEditor
                            onMount={handleOnMount}
                            readOnly={true}
                            wordWrap={true}
                            lineNumbers={false}
                            statusBar={false}
                            miniMap={false}
                        />
                    </SplitPanel>
                </SplitPanelGroup>
            </DialogContent>

            <DialogActions>
                <Button onClick={() => onClose(null)}>
                    {t("cancel", "Cancel")}
                </Button>
                <Button
                    color="success"
                    onClick={() => {
                        if (selected !== null && filteredHistory) {
                            onClose({
                                query: filteredHistory[selected].qh_query,
                            });
                        }
                    }}
                    disabled={selected === null}
                >
                    {t("select", "Select")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default QueryHistoryDialog;