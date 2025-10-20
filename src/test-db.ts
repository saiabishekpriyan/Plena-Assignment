import { sequelize } from './db/sequelize';
import { BabyName } from './db/models/BabyName';

async function testDB() {
  try {
    await sequelize.authenticate();
    console.log(' DB connected');

    
    const names = await BabyName.findAll({ limit: 50 });
    console.log('First 50 rows:', names.map(n => ({ name: n.name, sex: n.sex })));

    await sequelize.close();
    console.log('DB connection closed');
  } catch (err) {
    console.error(err);
  }
}

testDB();
