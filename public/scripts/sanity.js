const SANITY_PROJECT_ID = 'g9ebnag6';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-03-01';

const SANITY_URL = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;

/**
 * Fetch data from Sanity using GROQ
 * @param {string} query GROQ query string
 * @param {object} params Optional parameters for the query
 * @returns {Promise<any>}
 */
async function sanityFetch(query, params = {}) {
    try {
        const urlParams = new URLSearchParams();
        urlParams.append('query', query);
        urlParams.append('$cb', Date.now().toString()); // Cache buster via unused GROQ variable
        for (const [key, value] of Object.entries(params)) {
            urlParams.append(`$${key}`, JSON.stringify(value));
        }

        const response = await fetch(`${SANITY_URL}?${urlParams.toString()}`, {
            cache: 'no-store' // Bust browser CORS caches safely
        });

        if (!response.ok) {
            throw new Error(`Sanity request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching data from Sanity CMS:', error);
        return null;
    }
}

/**
 * Resolves a Sanity image reference to a full CDN URL
 * @param {object} source The Sanity image object
 * @returns {string} The full asset URL
 */
function urlForImage(source) {
    if (!source || !source.asset || !source.asset._ref) return '';

    // Sanity image refs look like: image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg
    const parts = source.asset._ref.split('-');
    if (parts.length < 4) return '';

    const id = parts[1];
    const dimensions = parts[2];
    const format = parts[3];

    return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`;
}
