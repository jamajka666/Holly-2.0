import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../lib/db";

export interface AlertAttributes {
  id: number;
  title: string;
  message: string;
  cron: string | null;
  at: string | null;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type Creation = Optional<AlertAttributes, "id" | "cron" | "at" | "active">;

export class Alert extends Model<AlertAttributes, Creation> implements AlertAttributes {
  declare id: number;
  declare title: string;
  declare message: string;
  declare cron: string | null;
  declare at: string | null;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Alert.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING(1000), allowNull: false },
    cron: { type: DataTypes.STRING, allowNull: true },
    at: { type: DataTypes.STRING, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: "Alert" }
);

export async function initModels() {
  await sequelize.sync();
}
