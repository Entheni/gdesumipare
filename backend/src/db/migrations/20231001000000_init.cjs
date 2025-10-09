/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.text('password_hash').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('bills', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('category', 100);
    table.decimal('amount_rsd', 10, 2).notNullable();
    table.string('recurrence', 20).notNullable(); // monthly | yearly
    table.integer('due_day'); // 1-31
    table.date('next_due_date');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('notifications', (table) => {
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
    table.timestamp('sent_at');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('bills');
  await knex.schema.dropTableIfExists('users');
};

