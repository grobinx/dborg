import { DriverInfo, Properties } from "src/api/db";
import { ProfileUsePasswordType } from "./DriverPropertyPassword";

export type ProfileParametersType = {
    uniqueId?: string,
    driverUniqueId?: string,
    schemaPattern?: string,
    schemaName?: string,
    schemaColor?: string,
    schemaGroup?: string,
    usePassword?: ProfileUsePasswordType,
    properties?: Properties,
    driver?: DriverInfo,
}
