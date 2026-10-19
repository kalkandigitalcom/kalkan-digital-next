import "server-only";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { customers, projects, taskPriority, tasks, taskStatus } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { PAGE_SIZE, cleanQuery, likePattern, pageOf, pick, pickOptional } from "@/server/list";
import { addDays, istanbulLocalToDate, todayIso } from "@/lib/dates";

export async function listTasks(p: Record<string, string | undefined>) {
  await requireAdmin();
  const q = cleanQuery(p.q);
  const status = pickOptional(p.status, [...taskStatus.enumValues, "open"] as const) ?? (p.status === "all" ? undefined : "open");
  const priority = pickOptional(p.priority, taskPriority.enumValues);
  const due = pickOptional(p.due, ["overdue", "today", "week", "none"] as const);
  const customerId = p.customerId && /^[0-9a-f-]{36}$/i.test(p.customerId) ? p.customerId : undefined;
  const sort = pick(p.sort, ["due", "priority", "created"] as const, "due");
  const dir = p.dir === "desc" ? "desc" : "asc";
  const page = pageOf(p);
  const now = new Date();
  const today = todayIso();
  const endOfToday = istanbulLocalToDate(`${today}T23:59`)!;
  const endOfWeek = istanbulLocalToDate(`${addDays(today, 7)}T23:59`)!;

  const where: SQL[] = [];
  if (q) where.push(or(ilike(tasks.title, likePattern(q)), ilike(tasks.description, likePattern(q)))!);
  if (status === "open") where.push(inArray(tasks.status, ["todo", "in_progress"]));
  else if (status) where.push(eq(tasks.status, status));
  if (priority) where.push(eq(tasks.priority, priority));
  if (customerId) where.push(eq(tasks.customerId, customerId));
  if (due === "overdue") where.push(sql`${tasks.dueAt} < ${now}`);
  if (due === "today") where.push(sql`${tasks.dueAt} <= ${endOfToday}`);
  if (due === "week") where.push(sql`${tasks.dueAt} <= ${endOfWeek}`);
  if (due === "none") where.push(sql`${tasks.dueAt} is null`);
  const cond = where.length ? and(...where) : undefined;
  const prioRank = sql`case ${tasks.priority} when 'urgent' then 4 when 'high' then 3 when 'medium' then 2 else 1 end`;
  const sortCol = { due: tasks.dueAt, priority: prioRank, created: tasks.createdAt }[sort];

  const [rows, [count]] = await Promise.all([
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        dueAt: tasks.dueAt,
        remindAt: tasks.remindAt,
        priority: tasks.priority,
        status: tasks.status,
        completedAt: tasks.completedAt,
        customerId: tasks.customerId,
        customerName: customers.companyName,
        projectId: tasks.projectId,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(customers, eq(customers.id, tasks.customerId))
      .leftJoin(projects, eq(projects.id, tasks.projectId))
      .where(cond)
      .orderBy(dir === "asc" ? sql`${sortCol} asc nulls last` : sql`${sortCol} desc nulls last`, desc(tasks.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(cond),
  ]);
  return { rows, total: count?.n ?? 0, page, pageSize: PAGE_SIZE, now, status };
}

export async function getTask(id: string) {
  await requireAdmin();
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return row ?? null;
}
