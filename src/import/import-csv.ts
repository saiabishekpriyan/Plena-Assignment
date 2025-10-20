import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { sequelize } from '../db/sequelize';
import { BabyName } from '../db/models/BabyName';

const csvPath = process.env.CSV_DOWNLOAD_PATH || path.resolve('./data/babyNames.csv');

async function main() {
  await sequelize.authenticate();
  console.log('DB connected');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at', csvPath);
    process.exit(1);
  }

  const stream = fs.createReadStream(csvPath);
  const names: { name: string; sex: string }[] = [];

  stream.pipe(csv())
    .on('data', (row: any) => {
      // Inspect columns — dataset may have columns like 'Name', 'Sex', etc.
      // We'll attempt stable column names; adjust if needed.
      const name = row['Name'] || row['name'] || row['ChildName'] || row['child_name'] || row['babyName'];
      const sex = row['Sex'] || row['sex'] || row['Gender'] || row['gender'];
      if (name && sex) {
        names.push({ name: String(name).trim(), sex: String(sex).trim() });
      }
    })
    .on('end', async () => {
      console.log(`Parsed ${names.length} rows, inserting to DB (bulk)`);
      // optional deduping by name+sex
      const unique = new Map<string, { name: string; sex: string }>();
      for (const r of names) {
        const key = `${r.name.toLowerCase()}|${r.sex.toLowerCase()}`;
        if (!unique.has(key)) unique.set(key, r);
      }
      const toInsert = Array.from(unique.values()).map(r => ({ name: r.name, sex: r.sex }));
      // Use upsert or bulkCreate
      // Create in chunks to avoid too-large queries
      const chunkSize = 1000;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        await BabyName.bulkCreate(chunk, { ignoreDuplicates: true });
        console.log(`Inserted chunk ${i/chunkSize + 1}`);
      }
      console.log('Done importing.');
      process.exit(0);
    });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
