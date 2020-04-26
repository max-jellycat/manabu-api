require('dotenv').config({ path: require('find-config')('.env') });
const fs = require("fs");
var moment = require('moment');

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: '.tmp/data.db'
  }
});

const bookshelf = require('bookshelf')(knex);

const UsersPermissionsStore = bookshelf.Model.extend({
  tableName: 'users-permissions_permission'
});

const dumpUsersPermissions = async () => {
  try {
    const val = await UsersPermissionsStore.fetchAll();
    const date = moment().format('YYYYMMDDHHmm');
    const file = `data/users-permissions_permission-${date}.json`;
    const values = val.toJSON().reduce((obj, itm) => {
      const key = itm.type + '|' + itm.controller + '|' + itm.action + '|' + itm.role
      obj[key] = itm.enabled;
      return obj;
    }, {});
    fs.writeFileSync(file, JSON.stringify(values, null, 4));
    console.log(`dump written to ${file}`);
  } catch (e) {
    console.log("app error", e);
  } finally {
    knex.destroy();
  }
}

dumpUsersPermissions();