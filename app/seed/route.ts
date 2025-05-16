import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { members, themes } from '../lib/placeholder-data';
import { NextResponse as Response } from 'next/server';

const client = await db.connect();
console.log('Connected to database'); 

async function seedTestTable() {
  console.log('Seeding test table...');
  await client.sql`
    CREATE TABLE IF NOT EXISTS test_table (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
  `;

  const result = await client.query(`
    INSERT INTO test_table (name)
    VALUES ('Test ')
    RETURNING *;
  `);

  console.log('Test table seeded:', result.rows[0]);
  return result.rows[0];
}




async function seedThemes() { 
  console.log('Seeding themes...');
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  console.log('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await client.sql`
    CREATE TABLE IF NOT EXISTS themes (
      id SERIAL PRIMARY KEY,
      member_id UUID NOT NULL,
      title VARCHAR(64) NOT NULL,
      seconds INT NOT NULL,
      style VARCHAR(64) NOT NULL,
      key VARCHAR(6) NOT NULL,
      mode VARCHAR(20) NOT NULL,
      chords TEXT NOT NULL,
      tempo INT NOT NULL,
      rythm VARCHAR(12) NOT NULL,
      sample TEXT NULL,
      recording_url TEXT NULL,
      date VARCHAR(64) NOT NULL,
      status VARCHAR(16) NOT NULL,
      FOREIGN KEY (member_id) REFERENCES members(id)
    );
  `;
  console.log('CREATE TABLE IF NOT EXISTS themes');
  // const insertedThemes = await client.query(`
  //   INSERT INTO themes (name)
  //   VALUES ('Test ')
  //   RETURNING *;
  // `);

//   const insertedThemes = await Promise.all(
//     themes.map(async (theme) => {
//         console.log('theme:', theme);
//         return client.sql`
//         INSERT INTO themes (id, member_id, title, seconds, style, key, mode, chords, tempo, rythm, sample, date, status)
//         VALUES (${theme.id}, ${theme.member_id}, ${theme.title}, ${theme.seconds}, ${theme.style}, ${theme.key}, ${theme.mode}, ${theme.chords}, ${theme.tempo}, ${theme.rythm}, ${theme.sample}, ${theme.date}, ${theme.status})
//         ON CONFLICT (id) DO NOTHING;
//       `;
//     }),
//   );
//   return insertedThemes;
// }

const insertedThemes = await Promise.all(
  themes.map(async (theme) => {
    console.log('theme:', theme);
    return client.query(`
      INSERT INTO themes (id, member_id, title, seconds, style, key, mode, chords, tempo, rythm, sample, date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING;
    `, [theme.id, theme.member_id, theme.title, theme.seconds, theme.style, theme.key, theme.mode, theme.chords, theme.tempo, theme.rythm, theme.sample, theme.date, theme.status]);
  }),
);

console.log('Themes seeded.');
return insertedThemes;
}


async function seedMembers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await client.sql`
    CREATE TABLE IF NOT EXISTS members (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_name VARCHAR(64) NOT NULL,
      email VARCHAR(64) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      image_url TEXT NOT NULL,
      first_name VARCHAR(32),
      last_name VARCHAR(32),
      country VARCHAR(32),
      instrument VARCHAR(255)
    );
  `;
  const insertedMembers = await Promise.all(
    members.map(async (member) => {
      const hashedPassword = await bcrypt.hash(member.password, 10);
      console.log('member.details?.instrument:', member.details?.instrument);
      return client.sql`
        INSERT INTO members (id, user_name, email, password, image_url, first_name, last_name, country, instrument)
        VALUES (${member.id}, ${member.user_name}, ${member.email}, ${hashedPassword}, ${member.image_url}, ${member.details?.first_name}, ${member.details?.last_name}, ${member.details?.country}, ${member.details?.instrument})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedMembers;
}


export async function GET() {
  try {
    console.log('Seeding database...');
    await client.sql`BEGIN`;
    console.log('beggin...');
  // console.log(members);
   await seedMembers();
  // console.log('seedMembers...');
  // console.log(themes);
    await seedThemes();
  // seedTestTable();
    await client.sql`COMMIT`;
    console.log('Database seeded successfully');
    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.sql`ROLLBACK`;
    return Response.json({ error }, { status: 500 });
  }
}