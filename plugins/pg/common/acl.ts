import { DataGridChangeRow } from "@renderer/components/DataGrid/DataGrid";

export interface AclEntry {
    id: string;
    grantor: string;
    grantee: string;
    privilege_type: string;
    is_grantable: boolean;
    [key: string]: any;
}

/**
 * Łączy uprawnienia ACL w jedno uprawnienie ALL jeśli wszystkie określone uprawnienia są obecne.
 * 
 * @param acl - Lista wpisów ACL do przetworzenia
 * @param allPrivileges - Lista uprawnień, które mają być połączone w ALL (np. ['USAGE', 'CREATE'])
 * @returns Przetworzona lista ACL z połączonymi uprawnieniami
 * 
 * @example
 * // Dla schematów PostgreSQL
 * mergeAclPrivileges(acl, ['USAGE', 'CREATE'])
 * 
 * @example
 * // Dla tabel PostgreSQL
 * mergeAclPrivileges(acl, ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'])
 */
export function mergeAclPrivileges(
    acl: AclEntry[], 
    allPrivileges: readonly string[]
): AclEntry[] {
    if (allPrivileges.length === 0) {
        return acl;
    }

    const grouped = new Map<string, { entry: AclEntry; privileges: Set<string> }>();
    
    acl.forEach(entry => {
        const key = `${entry.grantor}|${entry.grantee}|${entry.is_grantable}`;
        
        if (!grouped.has(key)) {
            grouped.set(key, {
                entry: { ...entry },
                privileges: new Set([entry.privilege_type])
            });
        } else {
            grouped.get(key)!.privileges.add(entry.privilege_type);
        }
    });
    
    const result: AclEntry[] = [];
    const allPrivilegesSet = new Set(allPrivileges);
    
    grouped.forEach(({ entry, privileges }) => {
        // Sprawdź czy wszystkie wymagane uprawnienia są obecne
        const hasAllPrivileges = allPrivileges.every(priv => privileges.has(priv));
        
        if (hasAllPrivileges) {
            // Zamień na ALL i usuń uprawnienia składowe
            result.push({
                ...entry,
                privilege_type: 'ALL'
            });
            
            // Dodaj pozostałe uprawnienia (te które nie są częścią ALL)
            privileges.forEach(priv => {
                if (!allPrivilegesSet.has(priv)) {
                    result.push({
                        ...entry,
                        privilege_type: priv
                    });
                }
            });
        } else {
            // Dodaj wszystkie uprawnienia bez zmian
            privileges.forEach(priv => {
                result.push({
                    ...entry,
                    privilege_type: priv
                });
            });
        }
    });
    
    return result;
}

/**
 * Łączy uprawnienia ACL dla wszystkich rekordów w tablicy.
 * Modyfikuje rekordy w miejscu, aktualizując wskazaną właściwość ACL.
 * 
 * @param records - Tablica rekordów do przetworzenia
 * @param aclProperty - Nazwa właściwości zawierającej listę ACL (domyślnie 'acl')
 * @param allPrivileges - Lista uprawnień, które mają być połączone w ALL
 * @returns Ta sama tablica rekordów z przetworzonymi ACL
 * 
 * @example
 * // Dla schematów
 * mergeRecordsAcl(schemas, 'acl', ALL_PRIVILEGES.SCHEMA);
 * 
 * @example
 * // Dla tabel z niestandardową właściwością
 * mergeRecordsAcl(tables, 'table_acl', ALL_PRIVILEGES.TABLE);
 */
export function mergeRecordsAcl<T extends Record<string, any>>(
    records: T[],
    allPrivileges: readonly string[],
    aclProperty: string = 'acl',
): T[] {
    records.forEach(record => {
        const acl = record[aclProperty];
        if (Array.isArray(acl) && acl.length > 0) {
            (record as Record<string, any>)[aclProperty] = mergeAclPrivileges(acl, allPrivileges);
        }
    });
    
    return records;
}

/**
 * Uprawnienia dla różnych obiektów PostgreSQL które składają się na ALL
 */
export const ALL_PRIVILEGES = {
    SCHEMA: ['USAGE', 'CREATE'],
    TABLE: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'],
    SEQUENCE: ['USAGE', 'SELECT', 'UPDATE'],
    DATABASE: ['CREATE', 'CONNECT', 'TEMPORARY'],
    FUNCTION: ['EXECUTE'],
    TYPE: ['USAGE'],
    FOREIGN_DATA_WRAPPER: ['USAGE'],
    FOREIGN_SERVER: ['USAGE'],
    TABLESPACE: ['CREATE'],
} as const;
