# 🧠 Kaggle–HubSpot Integration Project

This project reads **baby names** from a **Kaggle CSV dataset**, stores them in a **MySQL database** using Sequelize ORM, and sends the data to a **HubSpot custom object** via the HubSpot API.

---

## 🚀 Features

- Fetches name and gender data from a Kaggle CSV file
- Stores data in a MySQL database
- Integrates with HubSpot CRM via API
- Uses environment variables to secure credentials
- TypeScript-based project for strong typing and maintainability

---

## 📁 Project Structure

```
kaggle-hubspot/
├── src/
│   ├── db/
│   │   ├── models/
│   │   │   └── BabyName.ts
│   │   └── sequelize.ts
│   ├── hubspot/
│   │   └── send-to-hubspot.ts
│   └── read-csv.ts
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/saiabishekpriyan/kaggle-hubspot.git
cd kaggle-hubspot
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Configure environment variables

Create a `.env` file in the project root with the following keys:

```env
# MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kaggle_db
DB_DIALECT=mysql

# HubSpot API
HUBSPOT_API_KEY=your_hubspot_private_app_token
HUBSPOT_OBJECT=p_babynames
```

> ⚠️ Do **not** share your `.env` file publicly. It contains sensitive credentials.

---

### 4️⃣ Setup MySQL database

Open your MySQL CLI or Workbench and create a database:

```sql
CREATE DATABASE kaggle_db;
```

You can verify the connection by running:

```bash
npx ts-node src/db/sequelize.ts
```

If the connection is successful, you’ll see:

```
✅ DB connected
```

---

### 5️⃣ Import Kaggle dataset into MySQL

Place your CSV file (e.g. `babyNames.csv`) inside a folder named `data/`.

Then run:

```bash
npx ts-node src/read-csv.ts
```

This will:
- Read the baby name CSV file
- Extract `name` and `sex`
- Store all data into your MySQL table

---

### 6️⃣ Send data to HubSpot

After successfully inserting data into MySQL, run:

```bash
npm run hubspot
```

This will:
- Fetch baby names from MySQL
- Push them to your HubSpot custom object (`p_babynames`)
- Log any errors or successful entries

Example output:
```
✅ DB connected
📤 Sending 148060 baby names to HubSpot custom object...
❌ HubSpot API error for Mary: Unable to infer object type from: p_babynames
✅ Successfully sent John
```

---

## 🧩 Common Issues

### ❌ `Unable to infer object type from: p_babynames`
- Make sure the **custom object** is created in HubSpot and matches the name in `.env` (`HUBSPOT_OBJECT`).

### ❌ `Access denied for user 'root'@'localhost'`
- Verify your MySQL credentials in `.env`.

### ❌ `HubSpot API error`
- Check that your **HubSpot API key** is correct and has proper CRM scopes (e.g. `crm.objects.custom.read_write`).

---

## 🧪 Verify Database Records

You can check if data is inserted correctly by logging into MySQL and running:

```sql
USE kaggle_db;
SELECT * FROM BabyNames LIMIT 10;
```

---

## 🧰 Development Scripts

| Command | Description |
|----------|--------------|
| `npm run hubspot` | Sends all baby names to HubSpot |
| `npx ts-node src/read-csv.ts` | Imports baby names from CSV to MySQL |
| `npm run dev` | (Optional) Start TypeScript watcher or nodemon script |

---

## 🧹 .gitignore

Your `.gitignore` should include:

```
node_modules/
.env
dist/
```

This prevents sensitive data (like API keys) and build artifacts from being committed.

---

## 🧑‍💻 Author

**Sai Abishek Priyan**  
📧 [GitHub Profile](https://github.com/saiabishekpriyan)

---

## 🛡️ License

This project is licensed under the **MIT License** — free to use and modify.
