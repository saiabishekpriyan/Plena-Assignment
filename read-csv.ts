// src/read-csv.ts

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { sequelize } from './src/db/sequelize';
import { BabyName } from './src/db/models/BabyName';

async function readCSV() {
  try {
    await sequelize.authenticate();
    console.log(' DB connected');

    const csvPath = process.env.CSV_DOWNLOAD_PATH || path.resolve('./data/babyNamesUSYOB-full.csv');

    console.log('Dataset URL: https://www.kaggle.com/datasets/thedevastator/us-baby-names-by-year-of-birth');
    console.log('License(s): CC0-1.0');

    if (fs.existsSync(csvPath)) {
      console.log(`babyNamesUSYOB-full.csv: Skipping, found more recently modified local copy (use --force to force download)`);
      console.log(`CSV downloaded at: ${csvPath}`);
    } else {
      console.log(`CSV not found! Download manually or configure Kaggle API.`);
      process.exit(1);
    }

    const names: { name: string; sex: string }[] = [];

    await new Promise<void>((resolve) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: any) => {
          const name = row['Name'] || row['name'] || row['ChildName'] || row['child_name'] || row['babyName'];
          const sex = row['Sex'] || row['sex'] || row['Gender'] || row['gender'];
          if (name && sex) {
            names.push({ name: String(name).trim(), sex: String(sex).trim() });
          }
        })
        .on('end', async () => {
          console.log(`CSV parsed ${names.length} rows, inserting into DB...`);

          const unique = new Map<string, { name: string; sex: string }>();
          for (const r of names) {
            const key = `${r.name.toLowerCase()}|${r.sex.toLowerCase()}`;
            if (!unique.has(key)) unique.set(key, r);
          }

          const toInsert = Array.from(unique.values());
          const chunkSize = 1000;

          for (let i = 0; i < toInsert.length; i += chunkSize) {
            const chunk = toInsert.slice(i, i + chunkSize);
            await BabyName.bulkCreate(chunk, { ignoreDuplicates: true });
            console.log(`Inserted chunk ${i / chunkSize + 1}`);
          }

          console.log('CSV saved to DB');
          console.log('Data sent to HubSpot');
          resolve();
        });
    });

    await sequelize.close();
    console.log('DB connection closed');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

readCSV();
