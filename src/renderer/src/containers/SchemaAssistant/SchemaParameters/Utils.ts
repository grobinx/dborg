import { Properties, PropertyInfo, PropertyType } from "../../../../../api/db";

export function textFieldWidth(type: PropertyType | "schema-pattern", title: string): string | undefined {
    switch (type) {
        case "password":
        case "string": return '25rem';
        case "number": return title.length <= 15 ? '10rem' : '15rem';
        case "file": return "30rem";
        case "schema-pattern": return "25rem";
    }
    return;
}

export function setPropertyValue(properties: Properties, property: PropertyInfo, value: string): Properties {
    if ((value ?? '') === '') {
        properties[property.name] = undefined;
    }
    else {
        switch (property.type) {
            case 'boolean': properties[property.name] = (value === 'true') ? true : undefined; break;
            case 'number': properties[property.name] = Number(value); break;
            default: properties[property.name] = value;
        }
    }
    return properties;
}

export function schemaPatternToName(pattern: string, properties: Properties): string {
    let result = pattern;
    for (const [key, value] of Object.entries(properties)) {
        if (value) {
            result = result.replaceAll("{{" + key + "}}", String(value));
        }
    }
    return result;
}
