import { expect, type Page } from "@playwright/test";

export const deleteAllRepos = async ({ request }: Page) => {
    const response = await request.get('/api/content-sources/v1/repositories/?origin=external,upload');

    expect(response.status()).toBe(200);

    const body = await response.json()

    expect(Array.isArray(body.data)).toBeTruthy()

    const uuidList = body.data.map((data: { uuid: string }) => data.uuid) as string[]

    if (uuidList.length) {
        const result = await request.post('/api/content-sources/v1/repositories/bulk_delete/', {
            data: {
                uuids: uuidList
            }
        });

        expect(result.status()).toBe(204);
    }
}
