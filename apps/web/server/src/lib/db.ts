import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: process.env.DB_FILE || "alerts.sqlite",
  logging: false,
});
