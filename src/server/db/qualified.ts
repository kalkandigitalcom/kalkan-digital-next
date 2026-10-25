import { getTableName, sql, type Column } from "drizzle-orm";

/**
 * Always-qualified column reference ("table"."column") for use inside raw `sql` subqueries.
 *
 * Drizzle renders a column interpolated into a `sql` template WITHOUT its table name when the
 * outer query selects from a single table (e.g. `"id"` instead of `"projects"."id"`). Inside a
 * correlated subquery such a bare name binds to the subquery's own table, silently producing
 * wrong results. Use this helper for every outer-column reference in raw correlated subqueries.
 */
export function qcol(column: Column) {
  return sql`${sql.identifier(getTableName(column.table))}.${sql.identifier(column.name)}`;
}
