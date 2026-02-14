// backend/config/connection.js
const Sequelize = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        // --- ALTERE ESTA LINHA ---
        dialect: 'mysql', // De 'mysql' para 'mariadb'
        // -------------------------
        port: process.env.DB_PORT || 3306,
        logging: false, // console.log para ver queries
        
        dialectOptions: {
            // ... (opções dateStrings e typeCast podem ser mantidas) ...
            dateStrings: true,
            typeCast: function (field, next) {
                if (field.type === 'DATETIME') {
                    return field.string();
                }
                return next();
            },
        },
        // timezone: ... (removido para usar UTC)
    }
);

module.exports = sequelize;