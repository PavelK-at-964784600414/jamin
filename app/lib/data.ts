import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';
import {
  Member, 
  Theme, 
  CollabRecord,
  EnrichedLayerWithParentTheme,
  CollaborationDisplayData,
  CollaborationDisplayDataWithLikes,
  Participant,
  ThemesTable,
  ThemesTableWithLikes,
  LatestThemes,
  ThemeForm, 
  FormattedMembersTable,
  LikeStats,
} from './definitions';
import { auth } from '../../auth';

const ITEMS_PER_PAGE = 6;

// Helper function to get current user ID
async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Helper function to fetch like stats for themes
async function getThemeLikeStats(themeId: string, userId?: string | null): Promise<LikeStats> {
  try {
    const [likesResult, userLikeResult] = await Promise.all([
      sql`
        SELECT
          COUNT(CASE WHEN like_type = 'like' THEN 1 END)::integer AS likes,
          COUNT(CASE WHEN like_type = 'dislike' THEN 1 END)::integer AS dislikes
        FROM theme_likes 
        WHERE theme_id = ${themeId}
      `,
      userId ? sql`
        SELECT like_type 
        FROM theme_likes 
        WHERE theme_id = ${themeId} AND member_id = ${userId}
      ` : { rows: [] }
    ]);

    const stats = likesResult.rows[0] || { likes: 0, dislikes: 0 };
    const userLike = userLikeResult.rows[0]?.like_type || null;

    return {
      likes: stats.likes,
      dislikes: stats.dislikes,
      userLike: userLike,
    };
  } catch (error) {
    console.error('Error fetching theme like stats:', error);
    return { likes: 0, dislikes: 0, userLike: null };
  }
}

// Helper function to fetch like stats for collaborations
async function getCollabLikeStats(collabId: string, userId?: string | null): Promise<LikeStats> {
  try {
    const [likesResult, userLikeResult] = await Promise.all([
      sql`
        SELECT
          COUNT(CASE WHEN like_type = 'like' THEN 1 END)::integer AS likes,
          COUNT(CASE WHEN like_type = 'dislike' THEN 1 END)::integer AS dislikes
        FROM collab_likes 
        WHERE collab_id = ${collabId}
      `,
      userId ? sql`
        SELECT like_type 
        FROM collab_likes 
        WHERE collab_id = ${collabId} AND member_id = ${userId}
      ` : { rows: [] }
    ]);

    const stats = likesResult.rows[0] || { likes: 0, dislikes: 0 };
    const userLike = userLikeResult.rows[0]?.like_type || null;

    return {
      likes: stats.likes,
      dislikes: stats.dislikes,
      userLike: userLike,
    };
  } catch (error) {
    console.error('Error fetching collab like stats:', error);
    return { likes: 0, dislikes: 0, userLike: null };
  }
}

export async function fetchUser(email: string): Promise<Member | undefined> {
  noStore();
  try {
    const user = await sql<Member>`SELECT * FROM members WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export async function fetchThemeById(id: string): Promise<ThemeForm | null> {
  noStore();
  try {
    const data = await sql<ThemeForm>`
      SELECT
        themes.id,
        themes.member_id,
        members.user_name, 
        themes.title,
        themes.description,
        themes.key AS keySignature, 
        themes.mode,
        themes.chords,
        themes.tempo,
        themes.instrument,
        themes.status,
        themes.recording_url AS sample,
        members.image_url AS image_url,
        themes.seconds,
        themes.date AS date
      FROM themes
      JOIN members ON themes.member_id = members.id
      WHERE themes.id = ${id};
    `;

    const theme = data.rows[0];
    if (theme) {
      // Convert tempo to number if it's stored as string and ThemeForm expects number
      theme.tempo = Number(theme.tempo); 
      // No sections property in ThemeForm based on provided definitions.ts
      // If sections were part of themes table and needed in ThemeForm, 
      // ThemeForm definition would need to be updated.
    }
    return theme || null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch theme.');
  }
}

export async function fetchLatestThemes(): Promise<LatestThemes[]> {
  noStore();
  try {
    const data = await sql<LatestThemes>`
      SELECT
        themes.id,
        themes.title,
        themes.date,
        members.user_name AS user_name,
        members.image_url AS image_url
      FROM themes
      JOIN members ON themes.member_id = members.id
      ORDER BY themes.date DESC
      LIMIT 5;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error fetchLatestThemes:', error);
    throw new Error('Failed to fetch the latest themes.');
  }
}

export async function fetchFilteredThemes(
  query: string,
  currentPage: number,
  itemsPerPage: number = ITEMS_PER_PAGE,
): Promise<ThemesTableWithLikes[]> {
  noStore();
  const offset = (currentPage - 1) * itemsPerPage;

  try {
    const userId = await getCurrentUserId();
    
    const themes = await sql<ThemesTable>`
      SELECT
        themes.id,
        themes.title,
        themes.date,
        themes.status,
        members.image_url AS image_url,
        members.user_name AS user_name,
        themes.seconds,
        themes.chords,
        themes.key,
        themes.mode,
        themes.tempo,
        themes.description,
        themes.recording_url,
        themes.instrument
      FROM themes
      JOIN members ON themes.member_id = members.id
      WHERE
        members.user_name ILIKE ${`%${query}%`} OR
        themes.title ILIKE ${`%${query}%`} OR
        themes.status ILIKE ${`%${query}%`}
      ORDER BY themes.date DESC
      LIMIT ${itemsPerPage} OFFSET ${offset}
    `;

    // Add like stats for each theme
    const themesWithLikes = await Promise.all(
      themes.rows.map(async (theme) => {
        const like_stats = await getThemeLikeStats(theme.id, userId);
        return {
          ...theme,
          like_stats,
        };
      })
    );

    return themesWithLikes;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch themes.');
  }
}

export async function fetchThemesPages(query: string, itemsPerPage: number = ITEMS_PER_PAGE): Promise<number> {
  noStore();
  try {
    const count = await sql`
      SELECT COUNT(*)
      FROM themes
      JOIN members ON themes.member_id = members.id
      WHERE
        members.user_name ILIKE ${`%${query}%`} OR
        themes.title ILIKE ${`%${query}%`} OR
        themes.status ILIKE ${`%${query}%`}
    `;
    const totalPages = Math.ceil(Number(count.rows[0].count) / itemsPerPage);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of theme pages.');
  }
}

export async function fetchMembers(query?: string, currentPage?: number): Promise<FormattedMembersTable[]> {
  noStore();
  const offset = ((currentPage || 1) - 1) * ITEMS_PER_PAGE;
  
  try {
    const data = await sql`
      SELECT
        m.id,
        m.user_name,
        m.email,
        m.image_url,
        COALESCE(m.instrument, 'Not specified') AS instrument,
        (SELECT COUNT(*) FROM themes t WHERE t.member_id = m.id) AS themes_count,
        (SELECT COUNT(*) FROM collabs c WHERE c.member_id = m.id) AS collabs_count,
        (SELECT t.title FROM themes t WHERE t.member_id = m.id ORDER BY t.date DESC LIMIT 1) AS theme_name,
        (SELECT t.date FROM themes t WHERE t.member_id = m.id ORDER BY t.date DESC LIMIT 1) AS latest_theme_date
      FROM members m
      WHERE
        (${query || ''} = '' OR 
         m.user_name ILIKE ${`%${query || ''}%`} OR 
         m.email ILIKE ${`%${query || ''}%`})
      ORDER BY m.user_name ASC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
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
    console.error('Database Error (fetchMembers):', err);
    throw new Error('Failed to fetch members.');
  }
}

export async function fetchMembersPages(query: string): Promise<number> {
  noStore();
  try {
    const count = await sql`
      SELECT COUNT(*)
      FROM members
      WHERE
        members.user_name ILIKE ${`%${query}%`} OR
        members.email ILIKE ${`%${query}%`}
    `;
    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of member pages.');
  }
}

// Changed return type to CollabRecord[]
export async function fetchLayersByThemeId(themeId: string): Promise<CollabRecord[]> {
  noStore();
  try {
    const id = String(themeId);
    const data = await sql<CollabRecord>`
      SELECT
        c.id, 
        c.title,
        c.instrument,
        c.recording_url as file_path, 
        c.parent_theme_id, 
        c.member_id, 
        c.date
      FROM collabs c
      WHERE c.parent_theme_id = ${id}
      ORDER BY c.date ASC;
    `;
    return data.rows;
  } catch (error) {
    console.error(`Database Error: Failed to fetch layers for theme ID ${themeId}:`, error);
    throw error;
  }
}

export async function fetchAllLayersWithParentThemes(): Promise<EnrichedLayerWithParentTheme[]> {
  noStore();
  try {
    const data = await sql<EnrichedLayerWithParentTheme>`
      SELECT
        c.id AS layer_id,
        c.title AS layer_title,
        c.instrument AS layer_instrument,
        c.date AS layer_date,
        c.recording_url AS layer_recording_url,
        c.member_id AS layer_creator_id,
        m_layer.user_name AS layer_creator_name,
        m_layer.image_url AS layer_creator_image_url,
        t.id AS parent_theme_id,
        t.title AS parent_theme_title,
        t.date AS parent_theme_date,
        t.recording_url AS parent_theme_recording_url,
        t.member_id AS parent_theme_creator_id,
        m_theme.user_name AS parent_theme_creator_name,
        m_theme.image_url AS parent_theme_creator_image_url
      FROM collabs c
      JOIN themes t ON c.parent_theme_id = t.id
      JOIN members m_layer ON c.member_id = m_layer.id
      JOIN members m_theme ON t.member_id = m_theme.id
      ORDER BY t.date DESC, c.date ASC;
    `;
    return data.rows;
  } catch (error) {
    console.error('Database Error: Failed to fetch all layers with parent themes:', error);
    throw error;
  }
}

export async function fetchCollaborationData(): Promise<CollaborationDisplayDataWithLikes[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    const enrichedLayers = await fetchAllLayersWithParentThemes();
    const collaborations: CollaborationDisplayData[] = [];

    // Group layers by theme
    const layersByTheme = new Map<string, EnrichedLayerWithParentTheme[]>();
    
    enrichedLayers.forEach(layer => {
      if (!layersByTheme.has(layer.parent_theme_id)) {
        layersByTheme.set(layer.parent_theme_id, []);
      }
      layersByTheme.get(layer.parent_theme_id)!.push(layer);
    });

    // For each theme, create cumulative collaborations
    for (const [themeId, layers] of layersByTheme) {
      // Sort layers chronologically
      layers.sort((a, b) => new Date(a.layer_date).getTime() - new Date(b.layer_date).getTime());

      // Create a collaboration for each layer, including all previous layers
      for (let i = 0; i < layers.length; i++) {
        const currentLayer = layers[i];
        const cumulativeLayers = layers.slice(0, i + 1); // All layers up to and including current
        
        // Get all unique participants up to this point (original creator + all layer creators so far)
        const participantMap = new Map<string, Participant>();
        
        // Add the original theme creator
        participantMap.set(currentLayer.parent_theme_creator_id, {
          id: currentLayer.parent_theme_creator_id,
          name: currentLayer.parent_theme_creator_name,
          image_url: currentLayer.parent_theme_creator_image_url,
        });

        // Add all layer creators up to this point
        cumulativeLayers.forEach(layer => {
          if (!participantMap.has(layer.layer_creator_id)) {
            participantMap.set(layer.layer_creator_id, {
              id: layer.layer_creator_id,
              name: layer.layer_creator_name,
              image_url: layer.layer_creator_image_url,
            });
          }
        });

        // Create cumulative layers array
        const cumulativeLayersData: any[] = cumulativeLayers.map(layer => ({
          layer_id: layer.layer_id,
          layer_title: layer.layer_title,
          layer_instrument: layer.layer_instrument,
          layer_date: layer.layer_date,
          layer_creator_id: layer.layer_creator_id,
          layer_creator_name: layer.layer_creator_name,
          layer_creator_image_url: layer.layer_creator_image_url,
          layer_recording_url: layer.layer_recording_url,
        }));

        // Create a collaboration record for this cumulative state
        const newCollab = {
          collab_id: currentLayer.layer_id, // Use the latest layer ID as the collaboration ID
          collab_title: currentLayer.layer_title,
          collab_instrument: currentLayer.layer_instrument,
          collab_date: currentLayer.layer_date,
          collab_creator_id: currentLayer.layer_creator_id,
          collab_creator_name: currentLayer.layer_creator_name,
          collab_creator_image_url: currentLayer.layer_creator_image_url,
          collab_recording_url: currentLayer.layer_recording_url,
          parent_theme_id: currentLayer.parent_theme_id,
          parent_theme_title: currentLayer.parent_theme_title,
          parent_theme_date: currentLayer.parent_theme_date,
          parent_theme_creator_id: currentLayer.parent_theme_creator_id,
          parent_theme_creator_name: currentLayer.parent_theme_creator_name,
          parent_theme_creator_image_url: currentLayer.parent_theme_creator_image_url,
          parent_theme_recording_url: currentLayer.parent_theme_recording_url,
          total_layers_count: cumulativeLayers.length, // Number of layers up to this point
          cumulative_layers: cumulativeLayersData,
          participants: Array.from(participantMap.values()),
        };
        
        console.log('Creating collaboration with ID:', newCollab.collab_id);
        collaborations.push(newCollab);
      }
    }
    
    // Sort by collaboration date (most recent first)
    collaborations.sort((a, b) => new Date(b.collab_date).getTime() - new Date(a.collab_date).getTime());

    // Add like stats for each collaboration
    const collaborationsWithLikes = await Promise.all(
      collaborations.map(async (collab) => {
        const like_stats = await getCollabLikeStats(collab.collab_id, userId);
        return {
          ...collab,
          like_stats,
        };
      })
    );

    return collaborationsWithLikes;

  } catch (error) {
    console.error('Database Error: Failed to fetch collaboration data:', error);
    throw error;
  }
}

// Renamed from fetchCollabsForChart to fetchCollabs and simplified typing
export async function fetchCollabs(): Promise<any[]> { // Using any[] for now
  noStore();
  try {
    console.log('fetchCollabs: Starting query...');
    const data = await sql`
      SELECT
        TO_CHAR(date::timestamp, 'YYYY-MM') AS month,
        COUNT(id)::text AS count
      FROM collabs
      GROUP BY month
      ORDER BY month ASC;
    `;
    console.log('fetchCollabs: Raw SQL result:', data.rows);
    
    // Map to the expected structure, converting count to number
    const result = data.rows.map((row: any) => ({
      month: row.month,
      count: parseInt(row.count, 10),
    }));
    
    console.log('fetchCollabs: Processed result:', result);
    return result;
  } catch (error) {
    console.error('Database Error (fetchCollabs):', error);
    throw new Error('Failed to fetch collaboration data for chart.');
  }
}

// Updated fetchCardData to provide necessary data without relying on theme.image_url
export async function fetchCardData() {
  noStore();
  try {
    const memberCountPromise = sql`SELECT COUNT(*) FROM members`;
    const themeCountPromise = sql`SELECT COUNT(*) FROM themes`;
    const collabCountPromise = sql`SELECT COUNT(*) FROM collabs`; // Assuming 'collabs' is the table for layers/arrangements

    const data = await Promise.all([
      memberCountPromise,
      themeCountPromise,
      collabCountPromise,
    ]);

    const numberOfMembers = Number(data[0].rows[0].count ?? '0');
    const numberOfThemes = Number(data[1].rows[0].count ?? '0'); // This is total themes
    const totalArangements = Number(data[2].rows[0].count ?? '0'); // This is total layers/collabs

    // The original call in cards.tsx was:
    // const { numberOfMembers, numberOfThemes, totalArangements, totalThemes } = await fetchCardData();
    // We are returning numberOfThemes as totalThemes as well, adjust if distinct logic is needed.
    return {
      numberOfMembers,
      numberOfThemes, // Represents total unique parent themes
      totalArangements, // Represents total layers or collaborative tracks
      totalThemes: numberOfThemes, // Assuming this means total parent themes for now
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

// Utility function, if needed elsewhere, or ensure it\'s imported if defined elsewhere
// export const formatCurrency = (amount: number | string) => {
//   return (Number(amount) / 100).toLocaleString('en-US', {
//     style: 'currency',
//     currency: 'USD',
//   });
// };

export async function fetchCollaborationById(collabId: string): Promise<CollaborationDisplayDataWithLikes | null> {
  noStore();
  try {
    console.log('fetchCollaborationById: Looking for collaboration with ID:', collabId, '(type:', typeof collabId, ')');
    
    // First, fetch all collaborations
    const collaborations = await fetchCollaborationData();
    
    console.log('fetchCollaborationById: Available collaboration IDs:', collaborations.map(c => ({ id: c.collab_id, type: typeof c.collab_id })));
    
    // Find the specific collaboration by ID (ensure both are strings for comparison)
    const collaboration = collaborations.find(collab => String(collab.collab_id) === String(collabId));
    
    console.log('fetchCollaborationById: Found collaboration:', collaboration ? 'Yes' : 'No');
    
    return collaboration || null;
  } catch (error) {
    console.error('Database Error: Failed to fetch collaboration by ID:', error);
    throw error;
  }
}

// Fetch themes created by a specific member
export async function fetchThemesByMemberId(memberId: string): Promise<ThemesTableWithLikes[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    
    const themes = await sql<ThemesTable>`
      SELECT
        themes.id,
        themes.title,
        themes.date,
        themes.status,
        themes.member_id,
        members.image_url AS image_url,
        members.user_name AS user_name,
        themes.seconds,
        themes.chords,
        themes.key,
        themes.mode,
        themes.tempo,
        themes.description,
        themes.recording_url,
        themes.instrument
      FROM themes
      JOIN members ON themes.member_id = members.id
      WHERE themes.member_id = ${memberId}
      ORDER BY themes.date DESC
    `;

    // Add like stats for each theme
    const themesWithLikes = await Promise.all(
      themes.rows.map(async (theme) => {
        const like_stats = await getThemeLikeStats(theme.id, userId);
        return {
          ...theme,
          like_stats,
        };
      })
    );

    return themesWithLikes;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch themes by member ID.');
  }
}

// Fetch collaborations where the member participated (created layers)
export async function fetchCollaborationsByMemberId(memberId: string): Promise<CollaborationDisplayDataWithLikes[]> {
  noStore();
  try {
    // First get all collaborations where this member participated
    const memberCollaborations = await sql`
      SELECT DISTINCT c.parent_theme_id
      FROM collabs c
      WHERE c.member_id = ${memberId}
      ORDER BY c.parent_theme_id
    `;

    if (memberCollaborations.rows.length === 0) {
      return [];
    }

    // Get all collaboration data and filter for ones where this member participated
    const allCollaborations = await fetchCollaborationData();
    
    // Get theme IDs where this member participated
    const memberThemeIds = new Set(memberCollaborations.rows.map(row => row.parent_theme_id));
    
    // Filter collaborations to only include those where the member participated
    const memberFilteredCollaborations = allCollaborations.filter(collab => {
      return collab.participants.some(participant => participant.id === memberId);
    });

    return memberFilteredCollaborations;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch collaborations by member ID.');
  }
}

// New function to fetch the total count of filtered themes
export async function fetchThemesCount(query: string): Promise<number> {
  noStore();
  try {
    const count = await sql`
      SELECT COUNT(*)
      FROM themes
      JOIN members ON themes.member_id = members.id
      WHERE
        members.user_name ILIKE ${`%${query}%`} OR
        themes.title ILIKE ${`%${query}%`} OR
        themes.status ILIKE ${`%${query}%`}
    `;
    return Number(count.rows[0].count);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of themes.');
  }
}

export async function fetchFilteredCollaborations(
  query: string = '',
  currentPage: number = 1,
  itemsPerPage: number = 6,
): Promise<CollaborationDisplayDataWithLikes[]> {
  noStore();
  try {
    const userId = await getCurrentUserId();
    const enrichedLayers = await fetchAllLayersWithParentThemes();
    const collaborations: CollaborationDisplayData[] = [];

    // Group layers by theme
    const layersByTheme = new Map<string, EnrichedLayerWithParentTheme[]>();
    
    enrichedLayers.forEach(layer => {
      if (!layersByTheme.has(layer.parent_theme_id)) {
        layersByTheme.set(layer.parent_theme_id, []);
      }
      layersByTheme.get(layer.parent_theme_id)!.push(layer);
    });

    // For each theme, create cumulative collaborations
    for (const [themeId, layers] of layersByTheme) {
      // Sort layers chronologically
      layers.sort((a, b) => new Date(a.layer_date).getTime() - new Date(b.layer_date).getTime());

      // Create a collaboration for each layer, including all previous layers
      for (let i = 0; i < layers.length; i++) {
        const currentLayer = layers[i];
        const cumulativeLayers = layers.slice(0, i + 1); // All layers up to and including current
        
        // Get all unique participants up to this point (original creator + all layer creators so far)
        const participantMap = new Map<string, Participant>();
        
        // Add the original theme creator
        participantMap.set(currentLayer.parent_theme_creator_id, {
          id: currentLayer.parent_theme_creator_id,
          name: currentLayer.parent_theme_creator_name,
          image_url: currentLayer.parent_theme_creator_image_url,
        });

        // Add all layer creators up to this point
        cumulativeLayers.forEach(layer => {
          if (!participantMap.has(layer.layer_creator_id)) {
            participantMap.set(layer.layer_creator_id, {
              id: layer.layer_creator_id,
              name: layer.layer_creator_name,
              image_url: layer.layer_creator_image_url,
            });
          }
        });

        // Create cumulative layers array
        const cumulativeLayersData: any[] = cumulativeLayers.map(layer => ({
          layer_id: layer.layer_id,
          layer_title: layer.layer_title,
          layer_instrument: layer.layer_instrument,
          layer_date: layer.layer_date,
          layer_creator_id: layer.layer_creator_id,
          layer_creator_name: layer.layer_creator_name,
          layer_creator_image_url: layer.layer_creator_image_url,
          layer_recording_url: layer.layer_recording_url,
        }));

        // Create a collaboration record for this cumulative state
        const newCollab = {
          collab_id: currentLayer.layer_id, // Use the latest layer ID as the collaboration ID
          collab_title: currentLayer.layer_title,
          collab_instrument: currentLayer.layer_instrument,
          collab_date: currentLayer.layer_date,
          collab_creator_id: currentLayer.layer_creator_id,
          collab_creator_name: currentLayer.layer_creator_name,
          collab_creator_image_url: currentLayer.layer_creator_image_url,
          collab_recording_url: currentLayer.layer_recording_url,
          parent_theme_id: currentLayer.parent_theme_id,
          parent_theme_title: currentLayer.parent_theme_title,
          parent_theme_date: currentLayer.parent_theme_date,
          parent_theme_creator_id: currentLayer.parent_theme_creator_id,
          parent_theme_creator_name: currentLayer.parent_theme_creator_name,
          parent_theme_creator_image_url: currentLayer.parent_theme_creator_image_url,
          parent_theme_recording_url: currentLayer.parent_theme_recording_url,
          total_layers_count: cumulativeLayers.length, // Number of layers up to this point
          cumulative_layers: cumulativeLayersData,
          participants: Array.from(participantMap.values()),
        };
        
        collaborations.push(newCollab);
      }
    }
    
    // Filter collaborations based on search query
    let filteredCollaborations = collaborations;
    if (query) {
      const queryLower = query.toLowerCase();
      filteredCollaborations = collaborations.filter(collab => 
        collab.collab_title.toLowerCase().includes(queryLower) ||
        collab.collab_creator_name.toLowerCase().includes(queryLower) ||
        collab.collab_instrument.toLowerCase().includes(queryLower) ||
        collab.parent_theme_title.toLowerCase().includes(queryLower) ||
        collab.parent_theme_creator_name.toLowerCase().includes(queryLower) ||
        collab.participants.some(participant => 
          participant.name.toLowerCase().includes(queryLower)
        )
      );
    }
    
    // Sort by collaboration date (most recent first)
    filteredCollaborations.sort((a, b) => new Date(b.collab_date).getTime() - new Date(a.collab_date).getTime());

    // Apply pagination
    const offset = (currentPage - 1) * itemsPerPage;
    const paginatedCollaborations = filteredCollaborations.slice(offset, offset + itemsPerPage);

    // Add like stats for each collaboration
    const collaborationsWithLikes = await Promise.all(
      paginatedCollaborations.map(async (collab) => {
        const like_stats = await getCollabLikeStats(collab.collab_id, userId);
        return {
          ...collab,
          like_stats,
        };
      })
    );

    return collaborationsWithLikes;

  } catch (error) {
    console.error('Database Error: Failed to fetch filtered collaboration data:', error);
    throw error;
  }
}

export async function fetchCollaborationsPages(query: string = '', itemsPerPage: number = 6): Promise<number> {
  noStore();
  try {
    const enrichedLayers = await fetchAllLayersWithParentThemes();
    const collaborations: CollaborationDisplayData[] = [];

    // Group layers by theme
    const layersByTheme = new Map<string, EnrichedLayerWithParentTheme[]>();
    
    enrichedLayers.forEach(layer => {
      if (!layersByTheme.has(layer.parent_theme_id)) {
        layersByTheme.set(layer.parent_theme_id, []);
      }
      layersByTheme.get(layer.parent_theme_id)!.push(layer);
    });

    // For each theme, create cumulative collaborations
    for (const [themeId, layers] of layersByTheme) {
      // Sort layers chronologically
      layers.sort((a, b) => new Date(a.layer_date).getTime() - new Date(b.layer_date).getTime());

      // Create a collaboration for each layer, including all previous layers
      for (let i = 0; i < layers.length; i++) {
        const currentLayer = layers[i];
        const cumulativeLayers = layers.slice(0, i + 1);
        
        const participantMap = new Map<string, Participant>();
        
        participantMap.set(currentLayer.parent_theme_creator_id, {
          id: currentLayer.parent_theme_creator_id,
          name: currentLayer.parent_theme_creator_name,
          image_url: currentLayer.parent_theme_creator_image_url,
        });

        cumulativeLayers.forEach(layer => {
          if (!participantMap.has(layer.layer_creator_id)) {
            participantMap.set(layer.layer_creator_id, {
              id: layer.layer_creator_id,
              name: layer.layer_creator_name,
              image_url: layer.layer_creator_image_url,
            });
          }
        });

        const newCollab = {
          collab_id: currentLayer.layer_id,
          collab_title: currentLayer.layer_title,
          collab_instrument: currentLayer.layer_instrument,
          collab_date: currentLayer.layer_date,
          collab_creator_id: currentLayer.layer_creator_id,
          collab_creator_name: currentLayer.layer_creator_name,
          collab_creator_image_url: currentLayer.layer_creator_image_url,
          collab_recording_url: currentLayer.layer_recording_url,
          parent_theme_id: currentLayer.parent_theme_id,
          parent_theme_title: currentLayer.parent_theme_title,
          parent_theme_date: currentLayer.parent_theme_date,
          parent_theme_creator_id: currentLayer.parent_theme_creator_id,
          parent_theme_creator_name: currentLayer.parent_theme_creator_name,
          parent_theme_creator_image_url: currentLayer.parent_theme_creator_image_url,
          parent_theme_recording_url: currentLayer.parent_theme_recording_url,
          total_layers_count: cumulativeLayers.length,
          cumulative_layers: [],
          participants: Array.from(participantMap.values()),
        };
        
        collaborations.push(newCollab);
      }
    }
    
    // Filter collaborations based on search query
    let filteredCollaborations = collaborations;
    if (query) {
      const queryLower = query.toLowerCase();
      filteredCollaborations = collaborations.filter(collab => 
        collab.collab_title.toLowerCase().includes(queryLower) ||
        collab.collab_creator_name.toLowerCase().includes(queryLower) ||
        collab.collab_instrument.toLowerCase().includes(queryLower) ||
        collab.parent_theme_title.toLowerCase().includes(queryLower) ||
        collab.parent_theme_creator_name.toLowerCase().includes(queryLower) ||
        collab.participants.some(participant => 
          participant.name.toLowerCase().includes(queryLower)
        )
      );
    }

    const totalPages = Math.ceil(filteredCollaborations.length / itemsPerPage);
    return totalPages;

  } catch (error) {
    console.error('Database Error: Failed to fetch collaboration pages count:', error);
    throw error;
  }
}

export async function fetchCollaborationsCount(query: string = ''): Promise<number> {
  noStore();
  try {
    const enrichedLayers = await fetchAllLayersWithParentThemes();
    const collaborations: CollaborationDisplayData[] = [];

    // Group layers by theme
    const layersByTheme = new Map<string, EnrichedLayerWithParentTheme[]>();
    
    enrichedLayers.forEach(layer => {
      if (!layersByTheme.has(layer.parent_theme_id)) {
        layersByTheme.set(layer.parent_theme_id, []);
      }
      layersByTheme.get(layer.parent_theme_id)!.push(layer);
    });

    // For each theme, create cumulative collaborations
    for (const [themeId, layers] of layersByTheme) {
      layers.sort((a, b) => new Date(a.layer_date).getTime() - new Date(b.layer_date).getTime());

      for (let i = 0; i < layers.length; i++) {
        const currentLayer = layers[i];
        const cumulativeLayers = layers.slice(0, i + 1);
        
        const participantMap = new Map<string, Participant>();
        
        participantMap.set(currentLayer.parent_theme_creator_id, {
          id: currentLayer.parent_theme_creator_id,
          name: currentLayer.parent_theme_creator_name,
          image_url: currentLayer.parent_theme_creator_image_url,
        });

        cumulativeLayers.forEach(layer => {
          if (!participantMap.has(layer.layer_creator_id)) {
            participantMap.set(layer.layer_creator_id, {
              id: layer.layer_creator_id,
              name: layer.layer_creator_name,
              image_url: layer.layer_creator_image_url,
            });
          }
        });

        const newCollab = {
          collab_id: currentLayer.layer_id,
          collab_title: currentLayer.layer_title,
          collab_instrument: currentLayer.layer_instrument,
          collab_date: currentLayer.layer_date,
          collab_creator_id: currentLayer.layer_creator_id,
          collab_creator_name: currentLayer.layer_creator_name,
          collab_creator_image_url: currentLayer.layer_creator_image_url,
          collab_recording_url: currentLayer.layer_recording_url,
          parent_theme_id: currentLayer.parent_theme_id,
          parent_theme_title: currentLayer.parent_theme_title,
          parent_theme_date: currentLayer.parent_theme_date,
          parent_theme_creator_id: currentLayer.parent_theme_creator_id,
          parent_theme_creator_name: currentLayer.parent_theme_creator_name,
          parent_theme_creator_image_url: currentLayer.parent_theme_creator_image_url,
          parent_theme_recording_url: currentLayer.parent_theme_recording_url,
          total_layers_count: cumulativeLayers.length,
          cumulative_layers: [],
          participants: Array.from(participantMap.values()),
        };
        
        collaborations.push(newCollab);
      }
    }
    
    // Filter collaborations based on search query
    let filteredCollaborations = collaborations;
    if (query) {
      const queryLower = query.toLowerCase();
      filteredCollaborations = collaborations.filter(collab => 
        collab.collab_title.toLowerCase().includes(queryLower) ||
        collab.collab_creator_name.toLowerCase().includes(queryLower) ||
        collab.collab_instrument.toLowerCase().includes(queryLower) ||
        collab.parent_theme_title.toLowerCase().includes(queryLower) ||
        collab.parent_theme_creator_name.toLowerCase().includes(queryLower) ||
        collab.participants.some(participant => 
          participant.name.toLowerCase().includes(queryLower)
        )
      );
    }

    return filteredCollaborations.length;

  } catch (error) {
    console.error('Database Error: Failed to fetch collaborations count:', error);
    throw error;
  }
}
