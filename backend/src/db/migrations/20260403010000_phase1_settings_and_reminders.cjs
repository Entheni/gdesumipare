/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('reminders_enabled').notNullable().defaultTo(true);
    table.integer('reminder_days').notNullable().defaultTo(3);
    table.string('theme_preference', 20).notNullable().defaultTo('system');
  });

  await knex.schema.alterTable('notifications', (table) => {
    table.date('due_date');
    table.unique(['user_id', 'bill_id', 'due_date']);
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.alterTable('notifications', (table) => {
    table.dropUnique(['user_id', 'bill_id', 'due_date']);
    table.dropColumn('due_date');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('theme_preference');
    table.dropColumn('reminder_days');
    table.dropColumn('reminders_enabled');
  });
};
