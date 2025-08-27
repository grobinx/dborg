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
import React from "react";
import { ThemeIcons } from "./icons";
import { StatusBarButtonProps } from "@renderer/app/StatusBar/StatusBarButton";
import { ContainerButtonProps } from "@renderer/app/SideBar/ContainerButton";
import { ContainerProps, PrimaryContainerProps } from "@renderer/app/PrimaryContainer";
import { DriverSelectProps, SchemaAssistantProps } from "@renderer/containers/SchemaAssistant";
import { ButtonProps } from "@mui/material";
import { SchemaParametersProps } from "@renderer/containers/SchemaAssistant/SchemaParameters";
import { DriverSummaryProps } from "@renderer/containers/SchemaAssistant/DriverSelect/DriverSummary";
import { SchemaSummaryProps } from "@renderer/containers/SchemaAssistant/SchemaSummary/SchemaSummar";
import { SchemaBookProps, SchemaListProps } from "@renderer/containers/SchemaBook";
import { ToastListProps } from "@renderer/components/notifications/ToastList";
import { TabsPanelProps } from "@renderer/components/TabsPanel/TabsPanel";
import { TabPanelProps } from "@renderer/components/TabsPanel/TabPanel";
import { TabPanelLabelProps } from "@renderer/components/TabsPanel/TabPanelLabel";
import { TabPanelButtonsProps } from "@renderer/components/TabsPanel/TabPanelButtons";
import { UnboundBadgeProps } from "@renderer/components/UnboundBadge";
import { ToolTextFieldProps } from "@renderer/components/ToolTextField";
import { ColumnBaseType } from "src/api/db";
import { ToolSelectProps } from "@renderer/components/useful/ToolSelect";
import { ConsoleLogPanelProps } from "@renderer/components/ToolPanels/ConsoleLogsPanel";
import { SettingInputControlProps } from "@renderer/components/settings/SettingInputControl";
import { CodeProps } from "@renderer/components/Code";
import { FormattedTextProps } from "@renderer/components/useful/FormattedText";
import { BaseInputProps } from "@renderer/components/inputs/base/BaseInputProps";
import { InputDecoratorProps } from "@renderer/components/inputs/decorators/InputDecorator";
import { CodeComponent, CodeComponentProps, CodeComponentSlots } from "./theme.d/Code";
import { InputFieldComponent, InputFieldComponentProps, InputFieldComponentSlots } from "./theme.d/InputField";
import { InputDecoratorComponent, InputDecoratorComponentProps, InputDecoratorComponentSlots } from "./theme.d/InputDecorator";
import { ButtonComponent, ButtonComponentProps, ButtonComponentSlots } from "./theme.d/Button";
import { ZoomStateComponent, ZoomStateComponentProps, ZoomStateComponentSlots } from "./theme.d/ZoomState";
import { IconWrapperComponent, IconWrapperComponentProps, IconWrapperComponentSlots } from "./theme.d/IconWrapper";
import { FormattedTextComponent, FormattedTextComponentProps, FormattedTextComponentSlots } from "./theme.d/FormattedText";
import { SplitPanelComponent, SplitPanelComponentProps, SplitPanelComponentSlots } from "./theme.d/SplitPanel";
import { ConsoleLogPanelComponent, ConsoleLogPanelComponentProps, ConsoleLogPanelComponentSlots } from "./theme.d/ConsoleLogPanel";
import { WindowControlButtonComponent, WindowControlButtonComponentProps, WindowControlButtonComponentSlots } from "./theme.d/WindowControlButton";
import { SideBarComponent, SideBarComponentProps, SideBarComponentSlots } from "./theme.d/SideBar";
import { ToastListComponent, ToastListComponentProps, ToastListComponentSlots } from "./theme.d/ToastList";
import { StatusBarComponent, StatusBarComponentProps, StatusBarComponentSlots } from "./theme.d/StatusBar";
import { MenuBarComponent, MenuBarComponentProps, MenuBarComponentSlots } from "./theme.d/MenuBar";
import { SchemaAssistantComponent, SchemaAssistantComponentProps, SchemaAssistantComponentSlots } from "./theme.d/SchemaAssistant";
import { DriverSelectComponent, DriverSelectComponentProps, DriverSelectComponentSlots } from "./theme.d/DriverSelect";

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
        MenuBar: MenuBarComponentSlots;
        SideBar: SideBarComponentSlots;
        WindowControlButton: WindowControlButtonComponentSlots;
        ZoomState: ZoomStateComponentSlots;
        IconWrapper: IconWrapperComponentSlots;
        StatusBar: StatusBarComponentSlots;
        ContainerButton: 'root';
        ViewButton: 'root';
        PrimaryContainer: 'root';
        SchemaAssistant: SchemaAssistantComponentSlots;
        DriverSelect: DriverSelectComponentSlots;
        SchemaParameters: "root" | "driver" | "group" | "properties";
        SchemaSummary: "root" | "driver" | "schema";
        SchemaBook: "root";
        SchemaList: "root" | "content" | "title";
        ToastList: ToastListComponentSlots;
        TabsPanel: "root" | "header" | "content";
        TabPanel: "content" | "button" | "label" | "buttons";
        UnboundBadge: "root";
        SplitPanel: SplitPanelComponentSlots;
        ToolTextField: "root";
        ToolSelect: "root";
        ConsoleLogPanel: ConsoleLogPanelComponentSlots;
        SettingsInputControl: "root" | "internal" | "label" | "description" | "effect" | "validity" | "input";
        Code: CodeComponentSlots;
        FormattedText: FormattedTextComponentSlots;
        InputField: InputFieldComponentSlots;
        InputDecorator: InputDecoratorComponentSlots;
        Button: ButtonComponentSlots;
        IconButton: IconButtonComponentSlots;
        ToolButton: ToolButtonComponentSlots;
    }

    interface ComponentsPropsList {
        SideBar: SideBarComponentProps;
        MenuBar: MenuBarComponentProps;
        WindowControlButton: WindowControlButtonComponentProps;
        ZoomState: ZoomStateComponentProps;
        IconWrapper: IconWrapperComponentProps;
        StatusBar: StatusBarComponentProps;
        StatusBarButton: Partial<StatusBarButtonProps>;
        ContainerButton: Partial<ContainerButtonProps>;
        ViewButton: Partial<ViewButtonProps>;
        Container: Partial<ContainerProps>;
        SchemaAssistant: SchemaAssistantComponentProps;
        DriverSelect: DriverSelectComponentProps;
        SchemaParameters: Partial<SchemaParametersProps>;
        DriverSummary: Partial<DriverSummaryProps>;
        SchemaSummary: Partial<SchemaSummaryProps>;
        SchemaBook: Partial<SchemaBookProps>;
        SchemaList: Partial<SchemaListProps>;
        ToastList: ToastListComponentProps;
        TabsPanel: Partial<TabsPanelProps>;
        TabPanel: Partial<TabPanelProps>;
        TabPanelLabel: Partial<TabPanelLabelProps>;
        TabPanelButtons: Partial<TabPanelButtonsProps>;
        ToolTextField: Partial<ToolTextFieldProps>;
        ToolSelect: Partial<ToolSelectProps>;
        UnboundBadge: Partial<UnboundBadgeProps>;
        SplitPanel: SplitPanelComponentProps;
        ConsoleLogPanel: ConsoleLogPanelComponentProps;
        SettingInputControl: Partial<SettingInputControlProps>;
        Code: CodeComponentProps;
        FormattedText: FormattedTextComponentProps;
        InputField: InputFieldComponentProps;
        InputDecorator: InputDecoratorComponentProps;
        Button: ButtonComponentProps;
        IconButton: IconButtonComponentProps;
        ToolButton: ToolButtonComponentProps;
    }
    interface Components {
        MenuBar?: MenuBarComponent;
        SideBar?: SideBarComponent;
        StatusBar?: StatusBarComponent;
        StatusBarButton?: {
            defaultProps?: ComponentsPropsList['StatusBarButton'];
            styleOverrides?: ComponentsOverrides<Theme>['StatusBarButton'];
            //variants?: ComponentsVariants['StatusBarButton']; 
        };
        WindowControlButton?: WindowControlButtonComponent;
        ZoomState?: ZoomStateComponent;
        IconWrapper?: IconWrapperComponent;
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
        SchemaAssistant?: SchemaAssistantComponent;
        DriverSelect?: DriverSelectComponent;
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
        ToastList?: ToastListComponent;
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
        SplitPanel?: SplitPanelComponent;
        ConsoleLogPanel?: ConsoleLogPanelComponent;
        SettingInputControl?: {
            defaultProps?: ComponentsPropsList['SettingInputControl'];
            styleOverrides?: ComponentsOverrides<Theme>['SettingInputControl'];
            //variants?: ComponentsVariants['SettingInputControl'];
        };
        Code?: CodeComponent;
        FormattedText?: FormattedTextComponent;
        InputField?: InputFieldComponent;
        InputDecorator?: InputDecoratorComponent;
        Button?: ButtonComponent;
        IconButton?: IconButtonComponent;
        ToolButton?: ToolButtonComponent;
    }

}
