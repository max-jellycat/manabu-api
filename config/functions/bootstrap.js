'use strict';
require('dotenv').config({
  path: require('find-config')('.env')
})

const fs = require('fs');
const path = require('path');
const _ = require('lodash')

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/3.0.0-beta.x/concepts/configurations.html#bootstrap
 */

const loadUserPermissions = async (permissions) => {
  // Load user permissions last dump
  const files = fs.readdirSync('./data');
  const recentDump = _.maxBy(files.filter(file => file.indexOf('users-permissions_permission') != -1), (f) => {
    const fullpath = path.join('./data', f);
    return fs.statSync(fullpath).ctime;
  });
  const fullpath = path.join('./data', recentDump);
  const dump = fs.readFileSync(fullpath);
  const jsonContent = JSON.parse(dump);

  // Sync DB with the dump
  for (const key in jsonContent) {
    const splittedKey = key.split('|');
    const permission = permissions.find(permission => permission.type == splittedKey[0] &&
      permission.controller == splittedKey[1] &&
      permission.action == splittedKey[2] &&
      permission.role == splittedKey[3]);
    if (permission) {
      const query = `UPDATE "users-permissions_permission" SET enabled = ${jsonContent[key]} WHERE id = ${permission.id}`;
      await strapi.connections.default.raw(query);
    }
    else {
      const values = JSON.stringify([...splittedKey, jsonContent[key]])
      let query = `INSERT INTO "users-permissions_permission" ("type","controller","action","role", "enabled") VALUES (${values.substring(1, values.length - 1)});`;
      await strapi.connections.default.raw(query);
    }
  }
}

module.exports = async () => {
  const permissions = await strapi.connections.default.raw('SELECT * from "users-permissions_permission"');
  await loadUserPermissions(permissions);
};
