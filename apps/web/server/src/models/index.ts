import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";

const DB_FILE = process.env.DB_FILE || "alerts.sqlite";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: DB_FILE,
  logging: false,
});

export class Alert extends Model<
  InferAttributes<Alert>,
  InferCreationAttributes<Alert>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare message: string;
  declare cron: string | null;
  declare at: string | null;
  declare active: boolean;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Alert.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    cron: { type: DataTypes.STRING, allowNull: true },
    at: { type: DataTypes.STRING, allowNull: true }, // případně DataTypes.DATE
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    // ↓ doplněno kvůli TS typům (Sequelize je stejně spravuje sám)
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: "Alert", // tabulka = "Alerts"
    timestamps: true,
  }
);

export async function initModels() {
  await sequelize.authenticate();
  // přidá/aktualizuje chybějící sloupce (bez destruktivních změn schématu)
  await sequelize.sync({ alter: true });
}

export default { sequelize, Alert, initModels };
