import { ApifyClient } from 'apify-client';
import type { ActorSettings, DatasetItem } from './types.js';

const ACTOR_ID = 'nXCKPalCKnRAQSG5S'; // contextractor actor

let client: ApifyClient | null = null;

function getClient(): ApifyClient {
    if (!client) {
        const token = process.env.APIFY_TOKEN;
        if (!token) {
            throw new Error('APIFY_TOKEN environment variable is not set');
        }
        client = new ApifyClient({ token });
    }
    return client;
}

export interface ActorRunResult {
    runId: string;
    datasetId: string;
    status: string;
}

export interface ActorInput extends ActorSettings {
    startUrls: Array<{ url: string }>;
    globs?: never[];
    linkSelector?: string;
}

/**
 * Run the Contextractor actor with given URLs and settings
 */
export async function runActor(
    urls: string[],
    settings: ActorSettings
): Promise<ActorRunResult> {
    const apifyClient = getClient();

    const input: ActorInput = {
        ...settings,
        startUrls: urls.map((url) => ({ url })),
        globs: [],
        linkSelector: '',
    };

    console.log(`  Starting actor run with ${urls.length} URL(s)...`);

    const run = await apifyClient.actor(ACTOR_ID).call(input, {
        waitSecs: 300,
    });

    if (!run.defaultDatasetId) {
        throw new Error('Actor run did not produce a dataset');
    }

    console.log(`  Actor run completed: ${run.id} (status: ${run.status})`);

    return {
        runId: run.id,
        datasetId: run.defaultDatasetId,
        status: run.status,
    };
}

/**
 * Fetch all items from a dataset
 */
export async function fetchDatasetItems(
    datasetId: string
): Promise<DatasetItem[]> {
    const apifyClient = getClient();

    const { items } = await apifyClient.dataset(datasetId).listItems();

    return items as unknown as DatasetItem[];
}
