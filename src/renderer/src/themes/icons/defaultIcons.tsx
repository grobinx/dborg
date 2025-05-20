import { CircularProgress, Palette, ThemeOptions } from "@mui/material";
import { IconWrapper } from ".";
import * as MuiIcons from "@mui/icons-material";
import * as BsIcons from "react-bootstrap-icons";
import { BookDatabase } from "./svg/BookDatabase";
import { Cupcake } from "./svg/Cupcake";
import { DatabaseEditOutline } from "./svg/DatabaseEdit";
import { Connected } from "./svg/Connected";
import { Disconnected } from "./svg/Disconnected";
import { GroupList } from "./svg/GroupList";
import { Testcafe } from "./svg/Testcafe";
import { Sql } from "./svg/Sql";
import { DatabaseView } from "./svg/DatabaseView";
import { AdjustWidth } from "./svg/AdjustWidth";
import { Reset } from "./svg/Reset";
import { Strict } from "./svg/Strict";
import { WholeWord } from "./svg/WholeWord";
import { CaseSensitive } from "./svg/CaseSensitive";
import { AddTabRight } from "./svg/AddTabRight";
import { NotEqual } from "./svg/NotEqual";

const icons = (_palette: Palette): ThemeOptions => {
    return {
        icons: {
            MaximizeWindow: (props) => <IconWrapper {...props} className="maximize-window">&#128470;</IconWrapper>,
            MinimizeWindow: (props) => <IconWrapper {...props} className="minimize-window">&#128469;</IconWrapper>,
            CloseWindow: (props) => <IconWrapper {...props} className="close-window">&#128473;</IconWrapper>,
            RestoreWindow: (props) => <IconWrapper {...props} className="restore-window">&#128471;</IconWrapper>,
            ZoomIn: (props) => <IconWrapper {...props} className="zoom-in"><MuiIcons.ZoomIn fontSize="inherit" /></IconWrapper>,
            Error: (props) => <IconWrapper {...props} className="error"><MuiIcons.ErrorOutlineOutlined fontSize="inherit" /></IconWrapper>,
            Warning: (props) => <IconWrapper {...props} className="warning"><MuiIcons.WarningAmberOutlined fontSize="inherit" /></IconWrapper>,
            Hint: (props) => <IconWrapper {...props} className="hint"><MuiIcons.LightbulbOutlined fontSize="inherit" /></IconWrapper>,
            Info: (props) => <IconWrapper {...props} className="info"><MuiIcons.InfoOutlined fontSize="inherit" /></IconWrapper>,
            Success: (props) => <IconWrapper {...props} className="success"><MuiIcons.CheckCircleOutline fontSize="inherit" /></IconWrapper>,
            Notifications: (props) => <IconWrapper {...props} className="notifications"><MuiIcons.NotificationsOutlined fontSize="inherit" /></IconWrapper>,
            ConnectionList: (props) => <IconWrapper {...props} className="connection-list"><BookDatabase fontSize="inherit" /></IconWrapper>,
            NewConnection: (props) => <IconWrapper {...props} className="new-connection"><BsIcons.DatabaseAdd fontSize="inherit" /></IconWrapper>,
            Connections: (props) => <IconWrapper {...props} className="connections"><BsIcons.DatabaseCheck fontSize="inherit" /></IconWrapper>,
            EditConnectionSchema: (props) => <IconWrapper {...props} className="edit-connection"><DatabaseEditOutline fontSize="inherit" /></IconWrapper>,
            CloneConnectionSchema: (props) => <IconWrapper {...props} className="clone-connection"><MuiIcons.CopyAllOutlined fontSize="inherit" /></IconWrapper>,
            Settings: (props) => <IconWrapper {...props} className="settings"><BsIcons.Gear fontSize="inherit" /></IconWrapper>,
            OpenFile: (props) => <IconWrapper {...props} className="open-file"><MuiIcons.FileOpenOutlined fontSize="inherit" /></IconWrapper>,
            Visibility: (props) => <IconWrapper {...props} className="visibility"><MuiIcons.VisibilityOutlined fontSize="inherit" /></IconWrapper>,
            VisibilityOff: (props) => <IconWrapper {...props} className="visibility-off"><MuiIcons.VisibilityOffOutlined fontSize="inherit" /></IconWrapper>,
            AddPropertyTextField: (props) => <IconWrapper {...props} className="add-property-text-field"><MuiIcons.ControlPointOutlined fontSize="inherit" /></IconWrapper>,
            SelectGroup: (props) => <IconWrapper {...props} className="select-group"><MuiIcons.ExpandCircleDownOutlined fontSize="inherit" /></IconWrapper>,
            Plugins: (props) => <IconWrapper {...props} className="plugins"><MuiIcons.ExtensionOutlined fontSize="inherit" /></IconWrapper>,
            Cupcake: (props) => <IconWrapper {...props} className="cupcake"><Cupcake fontSize="inherit" /></IconWrapper>,
            Drink: (props) => <IconWrapper {...props} className="drink"><MuiIcons.LocalBarOutlined fontSize="inherit" /></IconWrapper>,
            Properties: (props) => <IconWrapper {...props} className="properties"><BsIcons.CardList fontSize="inherit" /></IconWrapper>,
            Connected: (props) => <IconWrapper {...props} className="connected"><Connected fontSize="inherit" /></IconWrapper>,
            Disconnected: (props) => <IconWrapper {...props} className="disconnected"><Disconnected fontSize="inherit" /></IconWrapper>,
            Delete: (props) => <IconWrapper {...props} className="delete"><MuiIcons.DeleteOutline fontSize="inherit" /></IconWrapper>,
            GroupList: (props) => <IconWrapper {...props} className="group-list"><GroupList fontSize="inherit" /></IconWrapper>,
            Close: (props) => <IconWrapper {...props} className="close"><MuiIcons.Close fontSize="inherit" /></IconWrapper>,
            ExpandLess: (props) => <IconWrapper {...props} className="expand-less"><MuiIcons.ExpandLess fontSize="inherit" /></IconWrapper>,
            ExpandMore: (props) => <IconWrapper {...props} className="expand-more"><MuiIcons.ExpandMore fontSize="inherit" /></IconWrapper>,
            ConnectionTest: (props) => <IconWrapper {...props} className="connection-test"><Testcafe fontSize="inherit" /></IconWrapper>,
            Loading: (props) => <IconWrapper {...props} className="loading"><CircularProgress size="inherit" /></IconWrapper>,
            Refresh: (props) => <IconWrapper {...props} className="refresh"><MuiIcons.Refresh fontSize="inherit" /></IconWrapper>,
            SqlEditor: (props) => <IconWrapper {...props} className="sql-editor"><Sql fontSize="inherit" /></IconWrapper>,
            DatabaseTables: (props) => <IconWrapper {...props} className="database-tables"><BsIcons.Table fontSize="inherit" /></IconWrapper>,
            DatabaseViews: (props) => <IconWrapper {...props} className="database-views"><DatabaseView fontSize="inherit" /></IconWrapper>,
            DataGrid: (props) => <IconWrapper {...props} className="data-grid"><MuiIcons.TableChartOutlined fontSize="inherit" /></IconWrapper>,
            AdjustWidth: (props) => <IconWrapper {...props} className="adjust-width"><AdjustWidth fontSize="inherit" /></IconWrapper>,
            Reset: (props) => <IconWrapper {...props} className="reset"><Reset fontSize="inherit" /></IconWrapper>,
            Clipboard: (props) => <IconWrapper {...props} className="clipboard"><BsIcons.Clipboard fontSize="inherit" /></IconWrapper>,
            Strict: (props) => <IconWrapper {...props} className="strict"><Strict fontSize="inherit" /></IconWrapper>,
            WholeWord: (props) => <IconWrapper {...props} className="whole-word"><WholeWord fontSize="inherit" /></IconWrapper>,
            CaseSensitive: (props) => <IconWrapper {...props} className="case-sensitive"><CaseSensitive fontSize="inherit" /></IconWrapper>,
            AddTab: (props) => <IconWrapper {...props} className="add-tab"><AddTabRight fontSize="inherit" /></IconWrapper>,
            ExcludeText: (props) => <IconWrapper {...props} className="exclude-text"><NotEqual fontSize="inherit" /></IconWrapper>,
            Search: (props) => <IconWrapper {...props} className="search"><MuiIcons.SearchOutlined fontSize="inherit" /></IconWrapper>,
        }
    }
}

export default icons;
