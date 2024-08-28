import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const deployments = pgTable('deployments', {
    id: serial('id').primaryKey(),
    projectId: text('project_id').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
