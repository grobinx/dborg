import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { RelationMetadata, RoutineMetadata, SchemaMetadata, SequenceMetadata, TypeMetadata, DatabaseMetadata, DatabasesMetadata } from "src/api/db";
import { t } from "i18next";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface OperationRisk {
    level: RiskLevel;
    message: string;
    details: string[];
}

export interface ObjectSafetyAssessment {
    canDelete: OperationRisk;
    canMove: OperationRisk;
    canChangeOwner: OperationRisk;
}

export interface AnalysisResult {
    found: boolean;
    objectType?: "relation" | "routine" | "schema" | "sequence" | "type";
    objectName?: string;
    schemaName?: string;
    assessment?: ObjectSafetyAssessment;
    usedInIdentifiers?: {
        type: "relation" | "routine";
        name: string;
        location: string;
    }[];
    error?: string;
}

export class ObjectSafetyAnalyzer {
    private session: IDatabaseSession;
    private identifiersCache: Map<string, Array<{ database: DatabaseMetadata, schema: SchemaMetadata, object: RoutineMetadata | RelationMetadata }>> = new Map();

    constructor(session: IDatabaseSession) {
        this.session = session;
        // Initialize cache when metadata becomes available
        session.getMetadata().then(metadata => {
            this.prepareIdentifierCache(metadata);
        }).catch(error => {
            console.error("Failed to prepare identifier cache:", error);
        });
    }

    private prepareIdentifierCache(metadata: DatabasesMetadata): void {
        const database = Object.values(metadata).find(db => db.connected);

        if (!database) {
            return;
        }

        this.identifiersCache.clear();
        Object.entries(database.schemas).forEach(([_schemaName, schema]) => {
            // Relacje
            Object.entries(schema.relations).forEach(([_relName, relation]) => {
                if (relation.identifiers && relation.identifiers.length > 0) {
                    relation.identifiers.forEach(id => {
                        const key = id.toLowerCase().trim();
                        if (!this.identifiersCache.has(key)) {
                            this.identifiersCache.set(key, []);
                        }
                        this.identifiersCache.get(key)!.push({
                            database,
                            schema,
                            object: relation
                        });
                    });
                }
            });

            // Rutyny
            if (schema.routines) {
                Object.entries(schema.routines).forEach(([_routineName, routineList]) => {
                    routineList.forEach((routine) => {
                        if (routine.identifiers && routine.identifiers.length > 0) {
                            routine.identifiers.forEach(id => {
                                const key = id.toLowerCase().trim();
                                if (!this.identifiersCache.has(key)) {
                                    this.identifiersCache.set(key, []);
                                }
                                this.identifiersCache.get(key)!.push({
                                    database,
                                    schema,
                                    object: routine
                                });
                            });
                        }
                    });
                });
            }
        });

    }

    /**
     * Ocenia bezpieczeństwo usuwania obiektu
     */
    assessDeletion(relation: RelationMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        // Sprawdzenie typu relacji
        if (relation.type === "view") {
            details.push(t("relation-is-view-safe-to-delete", "Relation is a view - safe to delete"));
        } else if (relation.kind === "temporary") {
            details.push(t("relation-is-temporary-table-safe-to-delete", "Relation is a temporary table - safe to delete"));
        } else if (relation.kind === "partitioned") {
            level = "high";
            details.push(t("relation-is-partitioned-table-may-contain-many-partitions", "Relation is partitioned - may contain many partitions"));
        }

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "critical";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        // Sprawdzenie statystyk
        if (relation.stats?.rows && relation.stats.rows > 100000) {
            level = level === "low" ? "medium" : "high";
            details.push(t("relation-has-many-rows", "Relation contains {{count}} rows - large amount of data", { count: relation.stats.rows }));
        }

        // Sprawdzenie klucza obcego
        if (relation.foreignKeys && relation.foreignKeys.length > 0) {
            level = "critical";
            details.push(t("relation-has-foreign-keys", "Relation has {{count}} foreign key(s) - may be referenced by other tables", { count: relation.foreignKeys.length }));
            relation.foreignKeys.forEach(fk => {
                details.push(t("relation-foreign-key-detail", "  - FK: {{name}} → {{referencedSchema}}.{{referencedTable}}", { name: fk.name, referencedSchema: fk.referencedSchema, referencedTable: fk.referencedTable }));
            });
        }

        // Sprawdzenie ograniczeń
        if (relation.constraints && relation.constraints.length > 0) {
            details.push(t("relation-has-constraints", "Relation has {{count}} constraint(s)", { count: relation.constraints.length }));
        }

        // Sprawdzenie indeksów
        if (relation.indexes && relation.indexes.length > 0) {
            const nonPrimaryIndexes = relation.indexes.filter(idx => !idx.primary);
            if (nonPrimaryIndexes.length > 0) {
                details.push(t("relation-has-non-primary-indexes", "Relation has {{count}} index(es) - they will be dropped", { count: nonPrimaryIndexes.length }));
            }
        }

        // Sprawdzenie uprawnień
        if (relation.permissions?.delete === false) {
            level = "critical";
            details.push(t("relation-no-permission-to-delete", "No permission to delete this relation"));
        }

        return {
            level,
            message: this.getRiskMessage("delete", level),
            details
        };
    }

    /**
     * Ocenia bezpieczeństwo przenoszenia obiektu
     */
    assessRelationMove(relation: RelationMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "critical";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        // Sprawdzenie typu relacji
        if (relation.type === "view") {
            level = level === "low" ? "medium" : level;
            details.push(t("relation-view-has-references", "Views can contain references to other objects"));
        }

        // Sprawdzenie identyfikatorów
        if (relation.identifiers && relation.identifiers.length > 0) {
            level = level === "low" ? "medium" : "high";
            details.push(t("relation-has-identifiers", "Relation has {{count}} identifiers - they may break", { count: relation.identifiers.length }));
            relation.identifiers.forEach(id => {
                details.push(`  - ${id}`);
            });
        }

        // Sprawdzenie kluczy obcych
        if (relation.foreignKeys && relation.foreignKeys.length > 0) {
            level = "high";
            details.push(t("relation-has-foreign-keys", "Relation has {{count}} foreign key(s) - references may break", { count: relation.foreignKeys.length }));
            relation.foreignKeys.forEach(fk => {
                details.push(t("relation-foreign-key-detail", "  - FK: {{name}} → {{referencedSchema}}.{{referencedTable}}", { name: fk.name, referencedSchema: fk.referencedSchema, referencedTable: fk.referencedTable }));
            });
        }

        // Sprawdzenie uprawnień
        if (relation.permissions?.select === false) {
            level = "critical";
            details.push(t("relation-no-permission-to-select", "No permission to access this relation"));
        }

        if (!usage || usage.length === 0) {
            details.push(t("relation-usage-check-warning", "Note: Check all views/functions referencing this relation"));
        }

        return {
            level,
            message: this.getRiskMessage("move", level),
            details
        };
    }

    private assessRoutineMove(routine: RoutineMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "critical";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        if (routine.kind === "trigger") {
            level = "high";
            details.push(t("trigger-move-warning", "Trigger - moving may affect table associations"));
        }

        if (routine.permissions?.execute === false) {
            level = "critical";
            details.push(t("no-permission-to-move-routine", "No permission to move this routine"));
        }

        details.push(t("move-requires-recreate-references", "References in views/other functions may need to be updated"));

        return {
            level,
            message: this.getRiskMessage("move", level),
            details
        };
    }

    /**
     * Ocena przenoszenia sekwencji
     */
    private assessSequenceMove(sequence: SequenceMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        details.push(t("sequence-can-be-moved", "Sequence can be moved to another schema"));

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "medium";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        if (sequence.permissions?.usage === false) {
            level = "critical";
            details.push(t("no-permission-to-move-sequence", "No permission to move this sequence"));
        }

        details.push(t("move-sequence-check-defaults", "Note: Check columns that use this sequence in DEFAULT clauses"));

        return {
            level,
            message: this.getRiskMessage("move", level),
            details
        };
    }

    /**
     * Ocena przenoszenia typu
     */
    private assessTypeMove(type: TypeMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        details.push(t("type-can-be-moved", "Type can be moved to another schema"));

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "high";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        if (type.kind === "composite") {
            level = level === "low" ? "medium" : level;
            details.push(t("composite-type-move-warning", "Composite type - tables using it may need updates"));
        }

        if (type.kind === "enum") {
            level = level === "low" ? "medium" : level;
            details.push(t("enum-type-move-warning", "ENUM type - columns using it need to be checked"));
        }

        if (type.kind === "domain") {
            level = "high";
            details.push(t("domain-type-move-warning", "Domain type - may underlie other types"));
        }

        if (type.permissions?.usage === false) {
            level = "critical";
            details.push(t("no-permission-to-move-type", "No permission to move this type"));
        }

        return {
            level,
            message: this.getRiskMessage("move", level),
            details
        };
    }

    /**
     * Ocenia bezpieczeństwo zmiany właściciela
     */
    assessChangeOwner(relation: RelationMetadata, currentOwner?: string): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        if (currentOwner) {
            details.push(t("current-owner-is", "Current owner: {{owner}}", { owner: currentOwner }));
        }

        // Sprawdzenie uprawnień na kolumnach
        // if (relation.columns.some(col => col.permissions)) {
        //     level = "medium";
        //     details.push(t("relation-columns-have-granular-permissions", "Some columns have granular permissions - may be blocked"));
        // }

        // Sprawdzenie indeksów
        if (relation.indexes && relation.indexes.length > 0) {
            details.push(t("relation-has-indexes", "Relation has {{count}} index(es) - owner may affect performance", { count: relation.indexes.length }));
        }

        // Sprawdzenie statystyk
        if (relation.stats && (relation.stats.rows || relation.stats.writes)) {
            level = level === "low" ? "medium" : level;
            details.push(t("relation-is-actively-used", "Relation is actively used - owner change may affect permissions"));
        }

        details.push(t("new-owner-must-have-permissions", "New owner must have required schema permissions"));

        return {
            level,
            message: this.getRiskMessage("changeOwner", level),
            details
        };
    }

    /**
     * Pełna ocena wszystkich operacji na relacji
     */
    assessRelation(relation: RelationMetadata, currentOwner?: string): ObjectSafetyAssessment {
        return {
            canDelete: this.assessDeletion(relation),
            canMove: this.assessRelationMove(relation),
            canChangeOwner: this.assessChangeOwner(relation, currentOwner)
        };
    }

    /**
     * Ocena dla rutyny (funkcji/procedury)
     */
    assessRoutineDeletion(routine: RoutineMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        if (routine.type === "function") {
            details.push(t("routine-function-usage", "Function - check if used in column expressions or views"));
        } else if (routine.type === "procedure") {
            details.push(t("routine-procedure-usage", "Procedure - check if called by the application"));
        }

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "critical";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        if (routine.kind === "trigger") {
            level = "high";
            details.push(t("routine-is-trigger", "Routine is a trigger - may affect automatic base operations"));
        }

        if (routine.kind === "aggregate") {
            level = level === "low" ? "medium" : level;
            details.push(t("routine-is-aggregate", "Routine is an aggregate - may be used in queries"));
        }

        if (routine.permissions?.execute === false) {
            level = "critical";
            details.push(t("no-permission-to-delete-routine", "No permission to delete this routine"));
        }

        return {
            level,
            message: this.getRiskMessage("delete", level),
            details
        };
    }

    /**
     * Ocena dla schematu
     */
    assessSchemaDeletion(schema: SchemaMetadata, relationsCount: number): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        if (schema.catalog) {
            level = "critical";
            details.push(t("schema-is-catalog", "Schema is catalog schema - cannot be deleted"));
        }

        if (schema.default) {
            level = "high";
            details.push(t("schema-is-default", "Schema is a default schema for the user"));
        }

        if (relationsCount > 0) {
            level = level === "low" ? "high" : "critical";
            details.push(t("schema-contains-objects", "Schema contains {{count}} objects - they will be deleted", { count: relationsCount }));
        }

        if (schema.routines && Object.keys(schema.routines).length > 0) {
            level = "critical";
            details.push(t("schema-contains-routines", "Schema contains {{count}} routine(s)", { count: Object.keys(schema.routines).length }));
        }

        if (schema.types && Object.keys(schema.types).length > 0) {
            level = "critical";
            details.push(t("schema-contains-types", "Schema contains {{count}} user-defined type(s)", { count: Object.keys(schema.types).length }));
        }

        if (schema.permissions?.usage === false) {
            level = "critical";
            details.push(t("no-permission-to-delete-schema", "No permission to delete this schema"));
        }

        return {
            level,
            message: this.getRiskMessage("delete", level),
            details
        };
    }

    /**
     * Sprawdza gdzie dany obiekt jest używany w identifiers (funkcjach, widokach, etc.)
     * Teraz korzysta z identifiersCache dla szybszego działania.
     */
    private findObjectUsageInIdentifiers(
        objectName: string,
        schemaName: string
    ): Array<{ type: "relation" | "routine"; name: string; location: string }> {
        const usage: Array<{ type: "relation" | "routine"; name: string; location: string }> = [];
        const keyVariants = [
            objectName.toLowerCase().trim(),
            `${schemaName.toLowerCase().trim()}.${objectName.toLowerCase().trim()}`,
            `"${schemaName}"."${objectName}"`
        ];

        // Przeszukaj cache po wszystkich wariantach klucza
        for (const key of keyVariants) {
            const found = this.identifiersCache.get(key);
            if (found) {
                found.forEach(obj => {
                    if (obj.object.type === "view") {
                        usage.push({
                            type: "relation",
                            name: `${obj.schema.identity}.${obj.object.name}`,
                            location: obj.object.type
                        });
                    } else if (obj.object.type === "function" || obj.object.type === "procedure") {
                        usage.push({
                            type: "routine",
                            name: `${obj.schema.identity}.${obj.object.name}`,
                            location: `${obj.object.type}/${obj.object.kind || "regular"}`
                        });
                    }
                });
            }
        }

        // Dodatkowo, jeśli identyfikator jest zagnieżdżony (np. w kodzie), sprawdź regex
        // (opcjonalnie, jeśli chcesz pełną zgodność jak poprzednio)
        // Możesz dodać fallback do starej logiki jeśli chcesz

        return usage;
    }

    /**
     * Sprawdza czy identyfikator zawiera odniesienie do obiektu
     */
    private matchesIdentifier(identifier: string, objectName: string, schemaName: string): boolean {
        // Normalizuj identyfikatory do porównania
        const normalizedId = identifier.toLowerCase().trim();
        const normalizedName = objectName.toLowerCase().trim();
        const normalizedSchema = schemaName.toLowerCase().trim();

        // Dokładne dopasowanie nazwy obiektu
        if (normalizedId === normalizedName) {
            return true;
        }

        // Dopasowanie w formacie schema.object
        if (normalizedId === `${normalizedSchema}.${normalizedName}`) {
            return true;
        }

        // Dopasowanie w formacie "schema"."object"
        if (normalizedId === `"${schemaName}"."${objectName}"`) {
            return true;
        }

        // Sprawdzenie czy identyfikator zawiera nazwę obiektu jako słowo kluczowe
        const regex = new RegExp(`\\b${this.escapeRegex(normalizedName)}\\b`, "i");
        if (regex.test(normalizedId)) {
            return true;
        }

        return false;
    }

    /**
     * Escapuje znaki specjalne do regex
     */
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    private getRiskMessage(operation: string, level: RiskLevel): string {
        const operationNames: Record<string, string> = {
            delete: t("operation-delete", "Delete"),
            move: t("operation-move", "Move"),
            changeOwner: t("operation-change-owner", "Change owner")
        };

        const messages: Record<RiskLevel, string> = {
            low: t("operation-risk-low", "{{operation}} is safe", { operation: operationNames[operation] }),
            medium: t("operation-risk-medium", "{{operation}} has medium risk", { operation: operationNames[operation] }),
            high: t("operation-risk-high", "{{operation}} has high risk", { operation: operationNames[operation] }),
            critical: t("operation-risk-critical", "{{operation}} is CRITICAL - requires special caution", { operation: operationNames[operation] })
        };

        return messages[level];
    }

    /**
     * Pobiera metadane i analizuje bezpieczeństwo operacji na obiekcie
     */
    async analyzeObjectSafety(
        schemaName: string,
        objectName: string,
    ): Promise<AnalysisResult> {
        try {
            // Pobierz metadane z sesji
            const metadata = await this.session.getMetadata();

            if (!metadata || Object.keys(metadata).length === 0) {
                return {
                    found: false,
                    error: t("error-metadata-fetch", "Could not fetch metadata from database")
                };
            }

            // Pobierz pierwszą bazę danych do której jesteś podłączony
            const database = Object.values(metadata).find(db => db.connected);

            if (!database) {
                return {
                    found: false,
                    error: t("error-database-not-found", "Database not found")
                };
            }

            // Sprawdź czy schemat istnieje
            const schema = database.schemas[schemaName];
            if (!schema) {
                return {
                    found: false,
                    error: t("error-schema-not-found", `Schema "${schemaName}" not found`)
                };
            }

            // Szukaj relacji (tabela/widok)
            const relation = schema.relations[objectName];
            if (relation) {
                const usage = this.findObjectUsageInIdentifiers(objectName, schemaName);
                return {
                    found: true,
                    objectType: "relation",
                    objectName,
                    schemaName,
                    usedInIdentifiers: usage,
                    assessment: {
                        canDelete: this.assessDeletion(relation, usage),
                        canMove: this.assessRelationMove(relation, usage),
                        canChangeOwner: this.assessChangeOwner(relation, relation.owner)
                    }
                };
            }

            // Szukaj rutyn (funkcji/procedur)
            if (schema.routines) {
                const routineList = schema.routines[objectName];
                if (routineList && routineList.length > 0) {
                    const routine = routineList[0]; // Analizuj pierwszy overload
                    const usage = this.findObjectUsageInIdentifiers(objectName, schemaName);
                    return {
                        found: true,
                        objectType: "routine",
                        objectName,
                        schemaName,
                        usedInIdentifiers: usage,
                        assessment: {
                            canDelete: this.assessRoutineDeletion(routine, usage),
                            canMove: this.assessRoutineMove(routine, usage),
                            canChangeOwner: this.assessRoutineChangeOwner(routine)
                        }
                    };
                }
            }

            // Szukaj sekwencji
            if (schema.sequences) {
                const sequence = schema.sequences[objectName];
                if (sequence) {
                    const usage = this.findObjectUsageInIdentifiers(objectName, schemaName);
                    return {
                        found: true,
                        objectType: "sequence",
                        objectName,
                        schemaName,
                        usedInIdentifiers: usage,
                        assessment: {
                            canDelete: this.assessSequenceDeletion(sequence, usage),
                            canMove: this.assessSequenceMove(sequence, usage),
                            canChangeOwner: this.assessSequenceChangeOwner(sequence)
                        }
                    };
                }
            }

            // Szukaj typów
            if (schema.types) {
                const type = schema.types[objectName];
                if (type) {
                    const usage = this.findObjectUsageInIdentifiers(objectName, schemaName);
                    return {
                        found: true,
                        objectType: "type",
                        objectName,
                        schemaName,
                        usedInIdentifiers: usage,
                        assessment: {
                            canDelete: this.assessTypeDeletion(type, usage),
                            canMove: this.assessTypeMove(type, usage),
                            canChangeOwner: this.assessTypeChangeOwner(type)
                        }
                    };
                }
            }

            // Sprawdź czy szukano schematu
            if (objectName === "" || objectName === schemaName) {
                const relationsCount = Object.keys(schema.relations).length;
                return {
                    found: true,
                    objectType: "schema",
                    objectName: schemaName,
                    schemaName,
                    assessment: {
                        canDelete: this.assessSchemaDeletion(schema, relationsCount),
                        canMove: this.createUnavailableOperation(t("operation-move-schema", "Move schema")),
                        canChangeOwner: this.assessSchemaChangeOwner(schema)
                    }
                };
            }

            return {
                found: false,
                error: t("error-object-not-found", "Object \"{{objectName}}\" not found in schema \"{{schemaName}}\"", { objectName, schemaName })
            };

        } catch (error) {
            return {
                found: false,
                error: t("error-analysis-failed", "Analysis failed: {{message}}", { message: error instanceof Error ? error.message : String(error) })
            };
        }
    }

    /**
     * Ocena zmiany właściciela dla rutyny
     */
    private assessRoutineChangeOwner(routine: RoutineMetadata): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        if (routine.owner) {
            details.push(t("current-owner-is", "Current owner: {{owner}}", { owner: routine.owner }));
        }

        if (routine.kind === "trigger") {
            level = "high";
            details.push(t("trigger-owner-change-warning", "Trigger - owner change may affect execution"));
        }

        if (routine.arguments && routine.arguments.length > 0) {
            details.push(t("routine-arguments-count", "Routine has {{count}} argument(s)", { count: routine.arguments.length }));
        }

        return {
            level,
            message: this.getRiskMessage("changeOwner", level),
            details
        };
    }

    /**
     * Ocena usuwania sekwencji
     */
    private assessSequenceDeletion(sequence: SequenceMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        details.push(t("sequence-name", "Sequence: {{name}}", { name: sequence.name }));

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "high";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        if (sequence.permissions?.usage === false) {
            level = "critical";
            details.push(t("no-permission-to-delete-sequence", "No permission to delete this sequence"));
        }

        if (!usage || usage.length === 0) {
            level = "medium";
            details.push(t("check-sequence-used-by-columns", "Note: Check if the sequence is used by columns (DEFAULT clauses)"));
        }

        return {
            level,
            message: this.getRiskMessage("delete", level),
            details
        };
    }

    /**
     * Ocena zmiany właściciela sekwencji
     */
    private assessSequenceChangeOwner(sequence: SequenceMetadata): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        if (sequence.owner) {
            details.push(t("current-owner-is", "Current owner: {{owner}}", { owner: sequence.owner }));
        }

        details.push(t("sequence-owner-change-safe", "Changing sequence owner is usually safe"));

        return {
            level,
            message: this.getRiskMessage("changeOwner", level),
            details
        };
    }

    /**
     * Ocena usuwania typu
     */
    private assessTypeDeletion(type: TypeMetadata, usage?: Array<any>): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        details.push(`Type: ${type.name} (${type.kind})`);

        // Sprawdzenie użycia w kodzie
        if (usage && usage.length > 0) {
            level = "high";
            details.push(t("object-used-in-code", "Object is used in {{count}} function/view codes:", { count: usage.length }));
            usage.slice(0, 10).forEach((u) => {
                details.push(`  - ${u.name} (${u.location})`);
            });
            if (usage.length > 10) {
                details.push(t("and-more-usages", "  ...and {{count}} more", { count: usage.length - 10 }));
            }
        }

        if (type.kind === "composite") {
            level = level === "low" ? "medium" : level;
            details.push(t("composite-type-warning", "Composite type - may be used by tables"));
        }

        if (type.kind === "enum") {
            level = level === "low" ? "medium" : level;
            details.push(t("enum-type-warning", "ENUM type - check if used by columns"));
        }

        if (type.kind === "domain") {
            level = "high";
            details.push(t("domain-type-warning", "Domain - may underlie other types and columns"));
        }

        if (type.permissions?.usage === false) {
            level = "critical";
            details.push(t("no-permission-to-delete-type", "No permission to delete this type"));
        }

        return {
            level,
            message: this.getRiskMessage("delete", level),
            details
        };
    }

    /**
     * Ocena zmiany właściciela typu
     */
    private assessTypeChangeOwner(type: TypeMetadata): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        if (type.owner) {
            details.push(t("current-owner", "Obecny właściciel: {{owner}}", { owner: type.owner }));
        }

        if (type.kind === "composite" || type.kind === "domain") {
            level = "medium";
            details.push(t("composite-type-owner-change-warning", "Composite type - owner change may affect access"));
        }

        return {
            level,
            message: this.getRiskMessage("changeOwner", level),
            details
        };
    }

    /**
     * Ocena zmiany właściciela schematu
     */
    private assessSchemaChangeOwner(schema: SchemaMetadata): OperationRisk {
        const details: string[] = [];
        let level: RiskLevel = "low";

        if (schema.owner) {
            details.push(t("current-owner", "Obecny właściciel: {{owner}}", { owner: schema.owner }));
        }

        if (schema.default) {
            level = "medium";
            details.push(t("default-schema-owner-change-warning", "Default schema - owner change may affect the user"));
        }

        if (schema.catalog) {
            level = "critical";
            details.push(t("catalog-schema-owner-change-warning", "Schema katalogowa - nie można zmienić właściciela"));
        }

        return {
            level,
            message: this.getRiskMessage("changeOwner", level),
            details
        };
    }

    /**
     * Pomocnicza funkcja zwracająca niedostępną operację
     */
    private createUnavailableOperation(operationName: string): OperationRisk {
        return {
            level: "high",
            message: t("operation-not-available", "{{operationName}} is not available for this object type", { operationName }),
            details: [t("operation-not-supported-for-object", "This operation is not supported for the selected object type")]
        };
    }
}

export default ObjectSafetyAnalyzer;