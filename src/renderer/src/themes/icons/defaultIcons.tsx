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
import { RefreshMetadata } from "./svg/RefreshMetadata";
import { Equal } from "./svg/Equal";
import { GreaterThan } from "./svg/GreaterThen";
import { LessThan } from "./svg/LessThen";
import { Tilde } from "@renderer/themes/icons/svg/Tilde";
import { Null } from "./svg/Null";
import { ElementOf } from "./svg/ElementOf";
import { Not } from "./svg/Not";
import { QueryHistory } from "./svg/QueryHistory";
import { ResetSearch } from "./svg/ResetSearch";
import { Editable } from "./svg/Editable";
import { ReadOnlyEditor } from "./svg/ReadOnlyEditor";
import { Digit } from "./svg/Digit";
import { SpecialChar } from "./svg/SpecialChar";
import { SpaceOff } from "./svg/SpaceOff";
import { UpperLetter } from "./svg/UpperLetter";
import { LowerLetter } from "./svg/LowerLetter";

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
            ResetSearch: (props) => <IconWrapper {...props} className="reset-search"><ResetSearch fontSize="inherit" /></IconWrapper>,
            SelectDatabaseSchema: (props) => <IconWrapper {...props} className="select-database-schema"><MuiIcons.FactCheckOutlined fontSize="inherit" /></IconWrapper>,
            RefreshMetadata: (props) => <IconWrapper {...props} className="refresh-metadata"><RefreshMetadata fontSize="inherit" /></IconWrapper>,
            Not: (props) => <IconWrapper {...props} className="not"><Not fontSize="inherit" /></IconWrapper>,
            Filter: (props) => <IconWrapper {...props} className="filter"><MuiIcons.FilterAltOutlined fontSize="inherit" /></IconWrapper>,
            Equal: (props) => <IconWrapper {...props} className="equal"><Equal fontSize="inherit" /></IconWrapper>,
            GreaterThan: (props) => <IconWrapper {...props} className="greater-than"><GreaterThan fontSize="inherit" /></IconWrapper>,
            LessThan: (props) => <IconWrapper {...props} className="less-than"><LessThan fontSize="inherit" /></IconWrapper>,
            SuchLike: (props) => <IconWrapper {...props} className="such-like"><Tilde fontSize="inherit" /></IconWrapper>,
            Null: (props) => <IconWrapper {...props} className="null"><Null fontSize="inherit" /></IconWrapper>,
            ElementOf: (props) => <IconWrapper {...props} className="element-of"><ElementOf fontSize="inherit" /></IconWrapper>,
            QueryHistory: (props) => <IconWrapper {...props} className="query-history"><QueryHistory fontSize="inherit" /></IconWrapper>,
            Check: (props) => <IconWrapper {...props} className="check"><MuiIcons.Check fontSize="inherit" /></IconWrapper>,
            Clock: (props) => <IconWrapper {...props} className="clock"><MuiIcons.AccessTimeOutlined fontSize="inherit" /></IconWrapper>,
            EditableEditor: (props) => <IconWrapper {...props} className="editable-editor"><Editable fontSize="inherit" /></IconWrapper>,
            ReadOnlyEditor: (props) => <IconWrapper {...props} className="read-only-editor"><ReadOnlyEditor fontSize="inherit" /></IconWrapper>,
            MoreHoriz: (props) => <IconWrapper {...props} className="more-horiz"><MuiIcons.MoreHoriz fontSize="inherit" /></IconWrapper>,
            MoreVert: (props) => <IconWrapper {...props} className="more-vert"><MuiIcons.MoreVert fontSize="inherit" /></IconWrapper>,
            Developer: (props) => <IconWrapper {...props} className="developer"><MuiIcons.ApiOutlined fontSize="inherit" /></IconWrapper>,
            GeneratePassword: (props) => <IconWrapper {...props} className="generate-password"><MuiIcons.VpnKey fontSize="inherit" /></IconWrapper>,
            Digit: (props) => <IconWrapper {...props} className="digit"><Digit fontSize="inherit" /></IconWrapper>,
            SpecialChar: (props) => <IconWrapper {...props} className="special-char"><SpecialChar fontSize="inherit" /></IconWrapper>,
            NoSpaces: (props) => <IconWrapper {...props} className="space-off"><SpaceOff fontSize="inherit" /></IconWrapper>,
            UpperLetter: (props) => <IconWrapper {...props} className="upper-letter"><UpperLetter fontSize="inherit" /></IconWrapper>,
            LowerLetter: (props) => <IconWrapper {...props} className="lower-letter"><LowerLetter fontSize="inherit" /></IconWrapper>,
            TextField: (props) => <IconWrapper {...props} className="text-field"><MuiIcons.TextFields fontSize="inherit" /></IconWrapper>,
            NumberField: (props) => <IconWrapper {...props} className="number-field"><MuiIcons.Numbers fontSize="inherit" /></IconWrapper>,
            PasswordField: (props) => <IconWrapper {...props} className="password-field"><MuiIcons.Password fontSize="inherit" /></IconWrapper>,
            EmailField: (props) => <IconWrapper {...props} className="email-field"><MuiIcons.AlternateEmail fontSize="inherit" /></IconWrapper>,
        }
    }
}

export default icons;
