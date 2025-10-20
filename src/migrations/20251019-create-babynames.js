import { DataTypes } from 'sequelize';
import sequelize from '../db/connection';

const BabyName = sequelize.define('BabyName', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sex: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  paranoid: false  // <--- disable soft deletes
});

export default BabyName;
