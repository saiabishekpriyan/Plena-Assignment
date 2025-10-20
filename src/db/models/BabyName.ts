import { Model, DataTypes } from "sequelize";
import { sequelize } from "../sequelize";

export type SexType = "male" | "female" | "other";

export class BabyName extends Model {
  public id!: number;
  public name!: string;
  public sex!: SexType;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  // Remove deletedAt since we are disabling paranoid
}

BabyName.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    sex: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: false,
    },
  },
  {
    tableName: "BabyNames",
    sequelize,
    timestamps: true,   // keeps createdAt and updatedAt
    paranoid: false,    // disable deletedAt / soft deletes
  }
);

export default BabyName;
