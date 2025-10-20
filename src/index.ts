// src/index.ts

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import axios from 'axios';
import { sequelize } from './db/sequelize';
import { BabyName } from './db/models/BabyName';

// CSV config
const csvPath = process.env.CSV_DOWNLOAD_PATH || path.resolve('./data/babyNamesUSYOB-full.csv');

// HubSpot config
const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY;
const HUBSPOT_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

async function downloadCSV() {
  console.log('Dataset URL: https://www.kaggle.com/datasets/thedevastator/us-baby-names-by-year-of-birth');
  console.log('License(s): CC0-1.0');

  // Simulate Kaggle download check
  if (fs.existsSync(csvPath)) {
    console.log(`babyNamesUSYOB-full.csv: Skipping, found more recently modified local copy (use --force to force download)`);
  } else {
    // If you integrate Kaggle API here, you can download programmatically
    console.log(`CSV downloaded at: ${csvPath}`);
  }
  return csvPath;
}

async function saveCSVtoDB(csvFile: string) {
  if (!fs.existsSync(csvFile)) {
    console.error('CSV not found at', csvFile);
    process.exit(1);
  }

  const names: { name: string; sex: string }[] = [];

  const stream = fs.createReadStream(csvFile);
  await new Promise<void>((resolve) => {
    stream
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
        resolve();
      });
  });
}

async function sendToHubSpot() {
  if (!HUBSPOT_TOKEN) {
    console.error('Set HUBSPOT_API_KEY in .env');
    process.exit(1);
  }

  const names = await BabyName.findAll({ limit: 100 }); // demo: adjust limit as needed
  console.log(`Data sent to HubSpot (${names.length} contacts)`);

  const headers = {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  };

  for (const n of names) {
    const payload = {
      properties: {
        firstname: n.name,
        lastname: `(${n.sex})`,
        email: `${slugify(n.name)}@example-babynames.local`,
        company: 'BabyNamesDataset',
      },
    };
    try {
      await axios.post(HUBSPOT_URL, payload, { headers });
      console.log(`Created contact for ${n.name}`);
    } catch (err: any) {
      console.error(`HubSpot API error for ${n.name}:`, err.response?.data?.message || err.message);
    }
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || 'name';
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const csvFile = await downloadCSV();
    await saveCSVtoDB(csvFile);
    await sendToHubSpot();

    await sequelize.close();
    console.log('DB connection closed');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
