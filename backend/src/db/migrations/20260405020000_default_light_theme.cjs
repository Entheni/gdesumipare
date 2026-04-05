/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex('users')
    .where({ theme_preference: 'system' })
    .update({ theme_preference: 'light' });

  await knex.schema.alterTable('users', (table) => {
    table.string('theme_preference', 20).notNullable().defaultTo('light').alter();
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('theme_preference', 20).notNullable().defaultTo('system').alter();
  });
};
