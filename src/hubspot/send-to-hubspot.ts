// src/hubspot/send-to-hubspot.ts

import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../db/sequelize';
import { BabyName } from '../db/models/BabyName';
import axios from 'axios';

async function main() {
  const HUBSPOT_TOKEN = process.env.HUBSPOT_API_KEY;
  if (!HUBSPOT_TOKEN) {
    console.error('Set HUBSPOT_API_KEY in .env');
    process.exit(1);
  }

  await sequelize.authenticate();
  console.log(' DB connected');

  // Fetch all baby names from DB (adjust limit if needed)
  const names = await BabyName.findAll({ limit: 100 }); 
  console.log(` Sending ${names.length} baby names to HubSpot contacts...`);

  const HUBSPOT_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';
  const headers = {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  };

  for (const n of names) {
    const payload = {
      properties: {
        firstname: n.name,
        lastname: n.sex, // Store sex in last name
      },
    };

    try {
      await axios.post(HUBSPOT_URL, payload, { headers });
      console.log(` Created contact for ${n.name}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      console.error(` HubSpot API error for ${n.name}:`, msg);
    }
  }

  await sequelize.close();
  console.log('DB connection closed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
