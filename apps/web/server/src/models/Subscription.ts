import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../lib/db";

interface SubscriptionAttrs {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt?: Date;
  updatedAt?: Date;
}
type SubscriptionCreate = Optional<SubscriptionAttrs, "id">;

export class Subscription extends Model<SubscriptionAttrs, SubscriptionCreate> implements SubscriptionAttrs {
  public id!: number;
  public endpoint!: string;
  public p256dh!: string;
  public auth!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subscription.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    endpoint: { type: DataTypes.STRING, allowNull: false, unique: true },
    p256dh: { type: DataTypes.STRING, allowNull: false },
    auth: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: "subscriptions" }
);

export async function syncSubscriptionModel() {
  await Subscription.sync();
}
