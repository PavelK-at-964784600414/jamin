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
    const themeCountPromise = sql<{ count: number }>`SELECT COUNT(*) as count FROM themes`;
    const memberCountPromise = sql<{ count: number }>`SELECT COUNT(*) as count FROM members`;
    const themeStatusPromise = sql<{ complete: number; in_progress: number }>`
      SELECT
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS "complete",
        SUM(CASE WHEN status = 'in progress' THEN 1 ELSE 0 END) AS "in_progress"
      FROM themes`;

    const [themeCountResult, memberCountResult, themeStatusResult] = await Promise.all([
      themeCountPromise,
      memberCountPromise,
      themeStatusPromise,
    ]);

    const numberOfThemes = themeCountResult.rows[0]?.count ?? 0;
    const numberOfMembers = memberCountResult.rows[0]?.count ?? 0;
    const totalArangements = themeStatusResult.rows[0]?.complete ?? 0;
    const totalThemes = themeStatusResult.rows[0]?.in_progress ?? 0;

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
    const count = await sql`
    SELECT COUNT(*) as count
    FROM themes
    JOIN members ON themes.member_id = members.id
    WHERE
      members.user_name ILIKE ${`%${query}%`} OR
      themes.title ILIKE ${`%${query}%`} OR
      themes.seconds::text ILIKE ${`%${query}%`} OR
      themes.status ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(count.rows[0]?.count ?? 0) / ITEMS_PER_PAGE);
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
        MAX(themes.date) AS latest_theme_date,
        (SELECT COUNT(*) FROM themes WHERE themes.member_id != members.id AND themes.parent_theme_id IN 
          (SELECT id FROM themes WHERE themes.member_id = members.id)
        ) AS collabs_count
      FROM members
      LEFT JOIN themes ON members.id = themes.member_id
      WHERE
        members.first_name ILIKE ${`%${query}%`} OR
        themes.title ILIKE ${'%' + query + '%'}
      GROUP BY members.id, themes.title
      ORDER BY members.user_name ASC
    `;

    // Format the data to match FormattedMembersTable
    const formattedMembers = data.rows.map(member => ({
      id: member.id,
      user_name: member.user_name,
      image_url: member.image_url,
      instrument: member.instrument || 'Not specified',
      themes_count: Number(member.themes_count) || 0,
      collabs_count: Number(member.collabs_count) || 0,
      theme_name: member.theme_name || 'No themes yet',
      latest_theme_date: member.latest_theme_date ? 
        new Date(member.latest_theme_date).toLocaleDateString() : 
        'N/A'
    }));

    return formattedMembers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all members.');
  }
}

export async function fetchThemeById(id: string) {
  console.log('fetchThemeById Fetching theme by ID:', id);
  try {
    // Now only select title as we've completed the schema transition
    const data = await sql<ThemesTable>`
      SELECT
        themes.*,
        themes.title,
        members.user_name,
        members.image_url
      FROM themes
      JOIN members ON themes.member_id = members.id
      WHERE themes.id = ${id};
    `;
    console.log('Fetched theme data:', data);
    const theme = data.rows[0];
    console.log('Theme:', theme);
    
    // Convert to ThemeForm format
    const themeForm = {
      id: theme.id,
      user_name: theme.user_name,
      title: theme.title,
      description: theme.description || '',
      seconds: theme.seconds,
      keySignature: theme.key, // Map key to keySignature
      mode: theme.mode,
      chords: theme.chords,
      tempo: theme.tempo,
      instrument: theme.instrument,
      sample: theme.recording_url, // Map recording_url to sample
      date: new Date(theme.date),
      status: theme.status as 'in progress' | 'complete'
    };
    
    return themeForm;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch theme.');
  }
}

export async function fetchLayersByThemeId(id: string) {
  try {
    const data = await sql<ThemesTable[]>`
      SELECT
        layers.*,
        members.user_name,
        members.image_url
      FROM themes AS layers
      JOIN members ON layers.member_id = members.id
      WHERE layers.parent_theme_id = ${id}
      ORDER BY layers.date DESC;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch theme layers.');
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
export async function fetchCollabs() {
  try {
    const data = await sql`
      SELECT
        date AS month,
        SUM(seconds) AS collab
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
    throw new Error('Failed to fetch collaborations.');
  }
}

export async function fetchArrangements() {
  try {
    // For simplicity, we'll return a static array of dummy data 
    // since the actual function appears to be missing from the codebase
    return [
      { month: 'Jan', revenue: 2000 },
      { month: 'Feb', revenue: 1800 },
      { month: 'Mar', revenue: 2200 },
      { month: 'Apr', revenue: 2500 },
      { month: 'May', revenue: 2300 },
      { month: 'Jun', revenue: 3200 },
      { month: 'Jul', revenue: 2800 },
      { month: 'Aug', revenue: 2400 },
      { month: 'Sep', revenue: 2900 },
      { month: 'Oct', revenue: 3100 },
      { month: 'Nov', revenue: 3500 },
      { month: 'Dec', revenue: 3800 },
    ];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch arrangements data.');
  }
}
