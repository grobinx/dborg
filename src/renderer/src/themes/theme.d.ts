// loaded in tsconfig.web.json

/**
 * Extends MUI theme options
 */

import { Theme as MuiTheme } from "@emotion/react";
import {
    ComponentsOverrides,
    ComponentsVariants,
    PaletteColor,
    PaletteColorOptions,
} from "@mui/material/styles";
import { AppSideBarProps } from "@renderer/components/app/AppSideBar";
import { MenuBarProps } from "@renderer/app/MenuBar/MenuBar";
import { WindowControlButtonProps } from "@renderer/app/MenuBar/WindowControlButton";
import React from "react";
import { IconWrapperProps, ThemeIcons } from "./icons";
import { StatusBarButtonProps } from "@renderer/app/StatusBar/StatusBarButton";
import { ContainerButtonProps } from "@renderer/app/SideBar/ContainerButton";
import { ContainerProps, PrimaryContainerProps } from "@renderer/app/PrimaryContainer";
import { DriverSelectProps, SchemaAssistantProps } from "@renderer/containers/SchemaAssistant";
import { ButtonProps } from "@mui/material";
import { StatusBarProps } from "@renderer/app/StatusBar";
import { SchemaParametersProps } from "@renderer/containers/SchemaAssistant/SchemaParameters";
import { DriverSummaryProps } from "@renderer/containers/SchemaAssistant/DriverSelect/DriverSummary";
import { SchemaSummaryProps } from "@renderer/containers/SchemaAssistant/SchemaSummary/SchemaSummar";
import { SchemaBookProps, SchemaListProps } from "@renderer/containers/SchemaBook";
import { ToastListProps } from "@renderer/components/notifications/ToastList";
import { TabsPanelProps } from "@renderer/components/TabsPanel/TabsPanel";
import { TabPanelProps } from "@renderer/components/TabsPanel/TabPanel";
import { ToolButtonProps } from "@renderer/components/ToolButton";
import { TabPanelLabelProps } from "@renderer/components/TabsPanel/TabPanelLabel";
import { TabPanelButtonsProps } from "@renderer/components/TabsPanel/TabPanelButtons";
import { UnboundBadgeProps } from "@renderer/components/UnboundBadge";
import { ColumnDataType } from "@renderer/components/DataGrid/DataGridTypes";
import { ToolTextFieldProps } from "@renderer/components/ToolTextField";
import { ColumnBaseType } from "src/api/db";
import { ToolSelectProps } from "@renderer/components/useful/ToolSelect";
import { ConsoleLogPanelProps } from "@renderer/components/ToolPanels/ConsoleLogsPanel";
import { SettingInputControlProps } from "@renderer/components/settings/SettingInputControl";
import { CodeProps } from "@renderer/components/Code";
import { FormattedTextProps } from "@renderer/components/useful/FormattedText";
import { BaseInputProps } from "@renderer/components/inputs/base/BaseInputProps";
import { InputDecoratorProps } from "@renderer/components/inputs/decorators/InputDecorator";

type Theme = Omit<MuiTheme, 'components'>;

export type DataTypeColors = Partial<{
    [key in ColumnBaseType | 'null']: string;
}>;

declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        label: true;
        description: true;
        monospace: true;
    }
}

declare module "@mui/material/styles" {

    interface TypographyVariants {
        label: React.CSSProperties;
        description: React.CSSProperties;
        monospace: React.CSSProperties;
        monospaceFontFamily: string;
    }

    // allow configuration using `createTheme()`
    interface TypographyVariantsOptions {
        label?: React.CSSProperties;
        description?: React.CSSProperties;
        monospace?: React.CSSProperties;
        monospaceFontFamily?: string;
    }

    interface ThemeOptions {
        icons?: ThemeIcons
    }

    interface Theme {
        icons: ThemeIcons
    }

    interface TypeBackground {
        sideBar: string;
        menuBar: string;
        statusBar: string;
        table: {
            header: string;
            container: string;
            footer: string;
        };
        tooltip: string;
    }

    interface Palette {
        main: PaletteColor;
        menuBar: PaletteColor;
        sideBar: PaletteColor;
        statusBar: PaletteColor;
        table: PaletteColor;
        dataType: DataTypeColors;
    }

    interface PaletteOptions {
        main?: PaletteColor;
        menuBar?: PaletteColor;
        sideBar?: PaletteColor;
        statusBar?: PaletteColor;
        table?: PaletteColor;
        dataType?: DataTypeColors;
    }

    interface ComponentNameToClassKey {
        MenuBar: 'root' | "title";
        SideBar: 'root';
        WindowControlButton: 'root';
        ZoomState: 'root' | 'value';
        IconWrapper: 'root';
        StatusBar: 'root' | 'button'
        ContainerButton: 'root';
        ViewButton: 'root';
        PrimaryContainer: 'root';
        SchemaAssistant: 'root' | 'title' | 'buttons' | 'stepper' | 'content';
        DriverSelect: 'root' | 'button' | 'icon';
        SchemaParameters: "root" | "driver" | "group" | "properties";
        SchemaSummary: "root" | "driver" | "schema";
        SchemaBook: "root";
        SchemaList: "root" | "content" | "title";
        ToastList: "root" | "paper" | "alert";
        TabsPanel: "root" | "header" | "content";
        TabPanel: "content" | "button" | "label" | "buttons";
        UnboundBadge: "root";
        SplitPanel: "group" | "panel" | "splitter";
        ToolTextField: "root";
        ToolSelect: "root";
        ConsoleLogPanel: "root" | "details";
        SettingsInputControl: "root" | "internal" | "label" | "description" | "effect" | "validity" | "input";
        Code: "root";
        FormattedText: "root";
        InputField: "root" | "input" | "adornment" | "placeholder" | "numberStepper" | "sliderLegend";
        InputDecorator: "root" | "indicator" | "container" | "label" | "labelText" | "restrictions" | "restriction" | "description" | "input" | "validity";
    }

    interface ComponentsPropsList {
        SideBar: Partial<AppSideBarProps>;
        MenuBar: Partial<MenuBarProps>;
        WindowControlButton: Partial<WindowControlButtonProps>;
        ZoomState: Partial<ZoomStateProps>;
        Icon: Partial<IconWrapperProps>;
        StatusBar: Partial<StatusBarProps>;
        StatusBarButton: Partial<StatusBarButtonProps>;
        ContainerButton: Partial<ContainerButtonProps>;
        ViewButton: Partial<ViewButtonProps>;
        Container: Partial<ContainerProps>;
        SchemaAssistant: Partial<SchemaAssistantProps>;
        DriverSelect: Partial<DriverSelectProps>;
        SchemaParameters: Partial<SchemaParametersProps>;
        DriverSummary: Partial<DriverSummaryProps>;
        SchemaSummary: Partial<SchemaSummaryProps>;
        SchemaBook: Partial<SchemaBookProps>;
        SchemaList: Partial<SchemaListProps>;
        ToastList: Partial<ToastListProps>;
        TabsPanel: Partial<TabsPanelProps>;
        TabPanel: Partial<TabPanelProps>;
        TabPanelLabel: Partial<TabPanelLabelProps>;
        TabPanelButtons: Partial<TabPanelButtonsProps>;
        ToolButton: Partial<ToolButtonProps>;
        ToolTextField: Partial<ToolTextFieldProps>;
        ToolSelect: Partial<ToolSelectProps>;
        UnboundBadge: Partial<UnboundBadgeProps>;
        ConsoleLogPanel: Partial<ConsoleLogPanelProps>;
        SettingInputControl: Partial<SettingInputControlProps>;
        Code: Partial<CodeProps>;
        FormattedText: Partial<FormattedTextProps>;
        InputField: Partial<BaseInputProps>;
        InputDecorator: Partial<InputDecoratorProps>;
    }
    interface Components {
        MenuBar?: {
            defaultProps?: ComponentsPropsList['MenuBar'];
            styleOverrides?: ComponentsOverrides<Theme>['MenuBar'];
            //variants?: ComponentsVariants['MenuBar'];
        };
        SideBar?: {
            defaultProps?: ComponentsPropsList['SideBar'];
            styleOverrides?: ComponentsOverrides<Theme>['SideBar'];
            //variants?: ComponentsVariants['SideBar'];
        };
        StatusBar?: {
            defaultProps?: ComponentsPropsList['Status'];
            styleOverrides?: ComponentsOverrides<Theme>['Status'];
            //variants?: ComponentsVariants['Status'];
        };
        StatusBarButton?: {
            defaultProps?: ComponentsPropsList['StatusBarButton'];
            styleOverrides?: ComponentsOverrides<Theme>['StatusBarButton'];
            //variants?: ComponentsVariants['StatusBarButton']; 
        };
        WindowControlButton?: {
            defaultProps?: ComponentsPropsList['WindowControlButton'];
            styleOverrides?: ComponentsOverrides<Theme>['WindowControlButton'];
            //variants?: ComponentsVariants['WindowControlButton'];
        };
        ZoomState?: {
            defaultProps?: ComponentsPropsList['ZoomState'];
            styleOverrides?: ComponentsOverrides<Theme>['ZoomState'];
            //variants?: ComponentsVariants['ZoomState'];
        };
        IconWrapper?: {
            defaultProps?: ComponentsPropsList['IconWrapper'];
            styleOverrides?: ComponentsOverrides<Theme>['IconWrapper'];
            //variants?: ComponentsVariants['IconWrapper'];
        };
        StatusBar?: {
            defaultProps?: ComponentsPropsList['StatusBar'];
            styleOverrides?: ComponentsOverrides<Theme>['StatusBar'];
            //variants?: ComponentsVariants['StatusBar'];
        };
        ContainerButton?: {
            defaultProps?: ComponentsPropsList['ContainerButton'];
            styleOverrides?: ComponentsOverrides<Theme>['ContainerButton'];
            //variants?: ComponentsVariants['ContainerButton'];
        };
        ViewButton?: {
            defaultProps?: ComponentsPropsList['ViewButton'];
            styleOverrides?: ComponentsOverrides<Theme>['ViewButton'];
            //variants?: ComponentsVariants['ViewButton'];
        };
        Container?: {
            defaultProps?: ComponentsPropsList['PrimaryContainer'];
            styleOverrides?: ComponentsOverrides<Theme>['PrimaryContainer'];
            //variants?: ComponentsVariants['PrimaryContainer'];
        };
        SchemaAssistant?: {
            defaultProps?: ComponentsPropsList['SchemaAssistant'];
            styleOverrides?: ComponentsOverrides<Theme>['SchemaAssistant'];
            //variants?: ComponentsVariants['SchemaAssistant'];
        };
        DriverSelect?: {
            defaultProps?: ComponentsPropsList['DriverSelect'];
            styleOverrides?: ComponentsOverrides<Theme>['DriverSelect'];
            //variants?: ComponentsVariants['DriverSelect'];
        };
        SchemaParameters?: {
            defaultProps?: ComponentsPropsList['SchemaParameters'];
            styleOverrides?: ComponentsOverrides<Theme>['SchemaParameters'];
            //variants?: ComponentsVariants['SchemaParameters'];
        };
        DriverSummary?: {
            defaultProps?: ComponentsPropsList['DriverSummary'];
            styleOverrides?: ComponentsOverrides<Theme>['DriverSummary'];
            //variants?: ComponentsVariants['DriverSummary'];
        };
        SchemaSummary?: {
            defaultProps?: ComponentsPropsList['SchemaSummary'];
            styleOverrides?: ComponentsOverrides<Theme>['SchemaSummary'];
            //variants?: ComponentsVariants['DriverSummary'];
        };
        SchemaBook?: {
            defaultProps?: ComponentsPropsList['SchemaBook'];
            styleOverrides?: ComponentsOverrides<Theme>['SchemaBook'];
            //variants?: ComponentsVariants['DriverSummary'];
        };
        SchemaList?: {
            defaultProps?: ComponentsPropsList['SchemaList'];
            styleOverrides?: ComponentsOverrides<Theme>['SchemaList'];
            //variants?: ComponentsVariants['DriverSummary'];
        };
        ToastList?: {
            defaultProps?: ComponentsPropsList['ToastList'];
            styleOverrides?: ComponentsOverrides<Theme>['ToastList'];
            //variants?: ComponentsVariants['ToastList'];
        };
        TabsPanel?: {
            defaultProps?: ComponentsPropsList['TabsPanel'];
            styleOverrides?: ComponentsOverrides<Theme>['TabsPanel'];
            //variants?: ComponentsVariants['TabsPanel'];
        };
        TabPanel?: {
            defaultProps?: ComponentsPropsList['TabPanel'];
            styleOverrides?: ComponentsOverrides<Theme>['TabPanel'];
            //variants?: ComponentsVariants['TabPanel'];
        };
        TabPanelLabel?: {
            defaultProps?: ComponentsPropsList['TabPanelLabel'];
            styleOverrides?: ComponentsOverrides<Theme>['TabPanelLabel'];
            //variants?: ComponentsVariants['TabPanelLabel'];
        };
        TabPanelButtons?: {
            defaultProps?: ComponentsPropsList['TabPanelButtons'];
            styleOverrides?: ComponentsOverrides<Theme>['TabPanelButtons'];
            //variants?: ComponentsVariants['TabPanelButtons'];
        };
        ToolButton?: {
            defaultProps?: ComponentsPropsList['ToolButton'];
            styleOverrides?: ComponentsOverrides<Theme>['ToolButton'];
            //variants?: ComponentsVariants['ToolButton'];
        };
        ToolTextField?: {
            defaultProps?: ComponentsPropsList['ToolTextField'];
            styleOverrides?: ComponentsOverrides<Theme>['ToolTextField'];
            //variants?: ComponentsVariants['ToolTextField'];
        };
        ToolSelect?: {
            defaultProps?: ComponentsPropsList['ToolSelect'];
            styleOverrides?: ComponentsOverrides<Theme>['ToolSelect'];
            //variants?: ComponentsVariants['ToolSelect'];
        };
        UnboundBadge?: {
            defaultProps?: ComponentsPropsList['UnboundBadge'];
            styleOverrides?: ComponentsOverrides<Theme>['UnboundBadge'];
            //variants?: ComponentsVariants['UnboundBadge'];
        };
        SplitPanel?: {
            styleOverrides?: ComponentsOverrides<Theme>['SplitPanel'];
        };
        ConsoleLogPanel?: {
            defaultProps?: ComponentsPropsList['ConsoleLogPanel'];
            styleOverrides?: ComponentsOverrides<Theme>['ConsoleLogPanel'];
            //variants?: ComponentsVariants['ConsoleLogPanel'];
        };
        SettingInputControl?: {
            defaultProps?: ComponentsPropsList['SettingInputControl'];
            styleOverrides?: ComponentsOverrides<Theme>['SettingInputControl'];
            //variants?: ComponentsVariants['SettingInputControl'];
        };
        Code?: {
            defaultProps?: ComponentsPropsList['Code'];
            styleOverrides?: ComponentsOverrides<Theme>['Code'];
            //variants?: ComponentsVariants['Code'];
        };
        FormattedText?: {
            defaultProps?: ComponentsPropsList['FormattedText'];
            styleOverrides?: ComponentsOverrides<Theme>['FormattedText'];
            //variants?: ComponentsVariants['FormattedText'];
        };
        InputField?: {
            //defaultProps?: ComponentsPropsList['InputField'];
            styleOverrides?: ComponentsOverrides<Theme>['InputField'];
            //variants?: ComponentsVariants['InputField'];
        };
        InputDecorator?: {
            //defaultProps?: ComponentsPropsList['InputDecorator'];
            styleOverrides?: ComponentsOverrides<Theme>['InputDecorator'];
            //variants?: ComponentsVariants['InputDecorator'];
        };
    }

}
