export interface ColumnMeta {
  name: string;
  dbType: string;
  udtName: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
}

export interface ForeignKeyMeta {
  columnName: string;
  foreignTableName: string;
  foreignColumnName: string;
}

export interface TableMeta {
  tableName: string;
  schema: string;
  isPartitioned: boolean;
  partitionStrategy?: "RANGE" | "LIST" | "HASH";
  columns: ColumnMeta[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyMeta[];
}

export interface SchemaIR {
  extractedAt: string;
  tables: TableMeta[];
}
