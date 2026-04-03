/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('incomes', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.decimal('amount_rsd', 10, 2).notNullable();
    table.string('recurrence', 20).notNullable().defaultTo('monthly');
    table.integer('day_of_month');
    table.date('next_income_date');
    table.text('note');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('incomes');
};
