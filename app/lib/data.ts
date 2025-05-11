import { sql } from '@vercel/postgres';
import {
  MemberField,
  MembersTableType,
  ThemeForm,
  ThemesTable,
  LatestThemesRaw,
  LatestThemes,
  ThemePages,
} from './definitions';
import { formatCurrency } from './utils';
const ITEMS_PER_PAGE = 6;


export async function fetchLatestThemes() {
  try {
    const data = await sql<LatestThemes>`
      SELECT themes.seconds, members.user_name AS member, members.image_url, themes.title, themes.date, themes.id
      FROM themes
      JOIN members ON themes.member_id = members.id
      ORDER BY themes.date DESC
      LIMIT 5;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest themes.');
  }
}


export async function fetchCardData() {
  try {
    const themeCountPromise = sql<{ count: number }[]>`SELECT COUNT(*) FROM themes`;
    const memberCountPromise = sql<{ count: number }[]>`SELECT COUNT(*) FROM members`;
    const themeStatusPromise = sql<{ complete: number; in_progress: number }[]>`
      SELECT
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS "complete",
        SUM(CASE WHEN status = 'in progress' THEN 1 ELSE 0 END) AS "in_progress"
      FROM themes`;

    const [themeCountResult, memberCountResult, themeStatusResult] = await Promise.all([
      themeCountPromise,
      memberCountPromise,
      themeStatusPromise,
    ]);

    const numberOfThemes = themeCountResult['rows'][0]['count'];
    const numberOfMembers = memberCountResult['rows'][0]['count'];
    const totalArangements = themeStatusResult['rows'][0]['complete'];
    const totalThemes = themeStatusResult['rows'][0]['in_progress'];

    return {
      numberOfMembers,
      numberOfThemes,
      totalArangements,
      totalThemes,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}


export async function fetchFilteredThemes(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const themes = await sql<ThemesTable>`
      SELECT
        themes.id,
        themes.seconds,
        themes.date,
        themes.status,
        themes.title,
        themes.chords,
        themes.key,
        themes.mode,
        themes.tempo,
        themes.description,
        themes.recording_url,
        members.user_name,
        themes.instrument,
        members.image_url
      FROM themes
      JOIN members ON themes.member_id = members.id
      WHERE
        members.user_name ILIKE ${`%${query}%`} OR
        themes.title ILIKE ${`%${query}%`} OR
        themes.instrument ILIKE ${`%${query}%`} OR
        themes.seconds::text ILIKE ${`%${query}%`} OR
        themes.date::text ILIKE ${`%${query}%`} OR
        themes.status ILIKE ${`%${query}%`}
      ORDER BY themes.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset};
    `;
    return themes.rows;
  } catch (error) {
    console.error('Database Error fetching filtered themes:', error);
    throw new Error('Failed to fetch themes.');
  }
}

export async function fetchThemesPages(query: string) {
  try {
    const count = await sql<ThemePages>`
    SELECT COUNT(*)
    FROM themes
    JOIN members ON themes.member_id = members.id
    WHERE
      members.user_name ILIKE ${`%${query}%`} OR
      themes.title ILIKE ${`%${query}%`} OR
      themes.seconds::text ILIKE ${`%${query}%`} OR
      themes.status ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of themes.');
  }
}

// add data.rows and totalPages to return statement, and what other things related on this return statement that needs to be updated
export async function fetchMembersPages(query: string) {
  try {
    const data = await sql`
      SELECT 
        COUNT(*) OVER() AS count,
        members.id,
        members.user_name,
        members.instrument,
        themes.title AS theme_name,
        COUNT(DISTINCT themes.id) AS themes_count,
        MAX(themes.date) AS latest_theme_date
      FROM members
      LEFT JOIN themes ON members.id = themes.member_id
      WHERE themes.title ILIKE ${'%' + query + '%'}
      GROUP BY members.id, themes.title
      ORDER BY members.user_name ASC
    `;
    if (data.rows.length === 0) {
      return 0;
    }
    const totalPages = Math.ceil(Number(data.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages; //, data.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all members.');
  }
}

export async function fetchMembers(query: string) {
  try {
    const data = await sql`
      SELECT
        members.id,
        members.user_name,
        members.image_url,
        members.instrument,
        themes.title AS theme_name,
        COUNT(DISTINCT themes.id) AS themes_count,
        MAX(themes.date) AS latest_theme_date
      FROM members
      LEFT JOIN themes ON members.id = themes.member_id
      WHERE
        members.first_name ILIKE ${`%${query}%`} OR
        themes.title ILIKE ${'%' + query + '%'}
      GROUP BY members.id, themes.title
      ORDER BY members.user_name ASC
    `;

    return data.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all members.');
  }
}

export async function fetchThemeById(id: string) {
  try {
    const data = await sql<ThemeForm>`
      SELECT
        themes.id,
        themes.member_id,
        themes.seconds,
        themes.status
      FROM themes
      WHERE themes.id = ${id};
    `;

    const theme = data.rows.map((theme) => ({
      ...theme,
      seconds: theme.seconds / 100, // Convert seconds from cents to dollars
    }));
    return theme[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch theme.');
  }
}




export async function fetchFilteredMembers(query: string) {
  try {
    const data = await sql<MembersTableType>`
      SELECT
        members.id,
        members.user_name,
        members.email,
        members.image_url,
        COUNT(themes.id) AS total_themes,
        SUM(CASE WHEN themes.status = 'in progress' THEN themes.seconds ELSE 0 END) AS total_in_progress,
        SUM(CASE WHEN themes.status = 'complete' THEN themes.seconds ELSE 0 END) AS total_complete
      FROM members
      LEFT JOIN themes ON members.id = themes.member_id
      WHERE
        members.name ILIKE ${`%${query}%`} OR
        members.email ILIKE ${`%${query}%`}
      GROUP BY members.id, members.name, members.email, members.image_url
      ORDER BY members.name ASC
    `;

    const members = data.rows.map((member) => ({
      ...member,
      total_in_progress: member.total_in_progress,
      total_complete: member.total_complete,
    }));

    return members;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch member table.');
  }
}
export async function fetchArrangements() {
  try {
    const data = await sql`
      SELECT
        date AS month,
        SUM(seconds) AS arrangement
      FROM (
        SELECT date, seconds FROM themes WHERE title = 'Theme1'
        UNION ALL
        SELECT date, seconds FROM themes WHERE title = 'Theme2'
      ) AS combined_themes
      GROUP BY date
      ORDER BY date;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch arrangements.');
  }
}
