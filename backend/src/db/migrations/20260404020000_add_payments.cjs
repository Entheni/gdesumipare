/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('bill_id')
      .notNullable()
      .references('id')
      .inTable('bills')
      .onDelete('CASCADE');
    table.decimal('amount_rsd', 10, 2).notNullable();
    table.date('due_date').notNullable();
    table.timestamp('paid_at').notNullable().defaultTo(knex.fn.now());
    table.text('note');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['bill_id', 'due_date']);
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('payments');
};
