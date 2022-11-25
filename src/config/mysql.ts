const { Sequelize } = require('sequelize');
import { DB_HOST, DB_PASSWORD, DB_USERNAME } from './index';

const sequelize = new Sequelize(
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
     {
       host: DB_HOST,
       dialect: 'mysql'
     }
);

export default sequelize;