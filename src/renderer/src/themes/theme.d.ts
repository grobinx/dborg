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
import { NotificationToastListProps } from "@renderer/components/notifications/NotificationToastList";
import { NotificationAdminPanelProps } from "@renderer/components/ToolPanels/NotificationAdminPanel";
import { TabsPanelProps } from "@renderer/components/TabsPanel/TabsPanel";
import { TabPanelProps } from "@renderer/components/TabsPanel/TabPanel";
import { ToolButtonProps } from "@renderer/components/ToolButton";
import { TabPanelLabelProps } from "@renderer/components/TabsPanel/TabPanelLabel";
import { TabPanelButtonsProps } from "@renderer/components/TabsPanel/TabPanelButtons";
import { UnboundBadgeProps } from "@renderer/components/UnboundBadge";
import { ColumnDataType } from "@renderer/components/DataGrid/DataGridTypes";
import { ToolTextFieldProps } from "@renderer/components/ToolTextField";
import { ColumnBaseType } from "src/api/db";

type Theme = Omit<MuiTheme, 'components'>;

export interface PaletteColorExtend extends PaletteColor {
    icon: string,
}

export type DataTypeColors = {
    [key in ColumnBaseType | 'null']: string;
};

export type PaletteColorOptionsExtend = PaletteColorOptions & {
    icon?: string,
}

declare module "@mui/material/styles" {

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
    }

    interface Palette {
        menuBar: PaletteColorExtend;
        sideBar: PaletteColorExtend;
        statusBar: PaletteColorExtend;
        table: PaletteColorExtend;
        dataType: DataTypeColors;
    }

    interface PaletteOptions {
        menuBar?: PaletteColorOptionsExtend;
        sideBar?: PaletteColorOptionsExtend;
        statusBar?: PaletteColorOptionsExtend;
        table?: PaletteColorOptionsExtend;
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
        NotificationToastList: "root" | "paper" | "alert";
        NotificationAdminPanel: "root";
        TabsPanel: "root" | "header" | "content";
        TabPanel: "content" | "button" | "label" | "buttons";
        UnboundBadge: "root";
        SplitPanel: "group" | "panel" | "splitter";
        ToolTextField: "root";
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
        NotificationToastList: Partial<NotificationToastListProps>;
        NotificationAdminPanel: Partial<NotificationAdminPanelProps>;
        TabsPanel: Partial<TabsPanelProps>;
        TabPanel: Partial<TabPanelProps>;
        TabPanelLabel: Partial<TabPanelLabelProps>;
        TabPanelButtons: Partial<TabPanelButtonsProps>;
        ToolButton: Partial<ToolButtonProps>;
        ToolTextField: Partial<ToolTextFieldProps>;
        UnboundBadge: Partial<UnboundBadgeProps>;
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
        NotificationToastList?: {
            defaultProps?: ComponentsPropsList['NotificationToastList'];
            styleOverrides?: ComponentsOverrides<Theme>['NotificationToastList'];
            //variants?: ComponentsVariants['NotificationToastList'];
        };
        NotificationAdminPanel?: {
            defaultProps?: ComponentsPropsList['NotificationAdminPanel'];
            styleOverrides?: ComponentsOverrides<Theme>['NotificationAdminPanel'];
            //variants?: ComponentsVariants['NotificationAdminPanel'];
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
        UnboundBadge?: {
            defaultProps?: ComponentsPropsList['UnboundBadge'];
            styleOverrides?: ComponentsOverrides<Theme>['UnboundBadge'];
            //variants?: ComponentsVariants['UnboundBadge'];
        };
        SplitPanel?: {
            styleOverrides?: ComponentsOverrides<Theme>['SplitPanel'];
        };
    }
    
}
