/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('subscription_tier', 20).notNullable().defaultTo('free');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('subscription_tier');
  });
};
