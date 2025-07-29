import { t } from "i18next";

export function validateStringLength(value: string, minLength?: number, maxLength?: number, next?: () => string | boolean): string | boolean {
    if (minLength && value.length < minLength) {
        return t("string-min-length", "Value must have at least {{minLength}} characters", { minLength });
    }
    if (maxLength && value.length > maxLength) {
        return t("string-max-length", "Value cannot exceed {{maxLength}} characters", { maxLength });
    }
    return next ? next() : true;
}

export function validateTextRows(value: string, minRows?: number, maxRows?: number, next?: () => string | boolean): string | boolean {
    if (minRows && value.split('\n').length < minRows || value === "") {
        return t("text-min-rows", "Value must have at least {{minRows}} rows", { minRows });
    }
    if (maxRows && value.split('\n').length > maxRows) {
        return t("text-max-rows", "Value cannot exceed {{maxRows}} rows", { maxRows });
    }
    return next ? next() : true;
}

export function validateNumberRange(value: number, min?: number, max?: number, next?: () => string | boolean): string | boolean {
    // const numericValue = parseFloat(value);
    // if (isNaN(numericValue)) {
    //     return t("number-invalid", "Invalid number");
    // }
    if (min !== undefined && value < min) {
        return t("number-min", "Value must be at least {{min}}", { min });
    }
    if (max !== undefined && value > max) {
        return t("number-max", "Value cannot exceed {{max}}", { max });
    }
    return next ? next() : true;
}

export function validatePassword(
    value: string,
    atLeastOneLowercase?: boolean,
    atLeastOneUppercase?: boolean,
    atLeastOneDigit?: boolean,
    atLeastOneSpecialChar?: boolean,
    specialChars?: string,
    noSpaces?: boolean,
    next?: () => string | boolean
): string | boolean {
    if (atLeastOneLowercase && !/[a-z]/.test(value)) {
        return t("password-at-least-one-lowercase", "Password must contain at least one lowercase letter");
    }
    if (atLeastOneUppercase && !/[A-Z]/.test(value)) {
        return t("password-at-least-one-uppercase", "Password must contain at least one uppercase letter");
    }
    if (atLeastOneDigit && !/\d/.test(value)) {
        return t("password-at-least-one-digit", "Password must contain at least one digit");
    }
    const listSpecialChars = specialChars || "!@#$%^&*()_+[]{}|;:',.<>?`~";
    const regSpecialChars = (listSpecialChars).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (atLeastOneSpecialChar && !new RegExp(`[${regSpecialChars}]`).test(value)) {
        return t("password-at-least-one-special-char", "Password must contain at least one of the following special characters: {{listSpecialChars}}", { listSpecialChars });
    }
    if (noSpaces && value.includes(" ")) {
        return t("password-no-spaces", "Password cannot contain spaces");
    }
    return next ? next() : true;
}

export function validateEmail(
    value: string,
    next?: () => string | boolean
): string | boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.trim() !== "" && !emailRegex.test(value)) {
        return t("email-invalid", "Invalid email address");
    }
    return next ? next() : true;
}