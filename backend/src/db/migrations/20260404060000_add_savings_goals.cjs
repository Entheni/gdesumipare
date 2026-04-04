/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('savings_goals', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.decimal('target_amount_rsd', 10, 2).notNullable();
    table.decimal('starting_amount_rsd', 10, 2).notNullable().defaultTo(0);
    table.decimal('monthly_contribution_goal_rsd', 10, 2);
    table.date('target_date');
    table.text('note');
    table.boolean('is_archived').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('goal_contributions', (table) => {
    table.increments('id').primary();
    table
      .integer('goal_id')
      .notNullable()
      .references('id')
      .inTable('savings_goals')
      .onDelete('CASCADE');
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.decimal('amount_rsd', 10, 2).notNullable();
    table.date('contribution_date').notNullable();
    table.text('note');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('goal_contributions');
  await knex.schema.dropTableIfExists('savings_goals');
};
