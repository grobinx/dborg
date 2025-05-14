import { DriverInfo, Properties } from "src/api/db";
import { SchemaUsePasswordType } from "./DriverPropertyPassword";

export type SchemaParametersType = {
    uniqueId?: string,
    driverUniqueId?: string,
    schemaPattern?: string,
    schemaName?: string,
    schemaColor?: string,
    schemaGroup?: string,
    usePassword?: SchemaUsePasswordType,
    properties?: Properties,
    driver?: DriverInfo,
}
