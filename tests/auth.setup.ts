import { expect, test as setup } from '@playwright/test';
import { throwIfMissingEnvVariables, closePopupsIfExist, logInWithUser1, storeStorageStateAndToken } from './helpers/loginHelpers';
import { describe } from 'node:test';

describe("Setup", async () => {
    setup('Ensure needed ENV variables exist', async ({ page }) => {
        expect(() => throwIfMissingEnvVariables()).not.toThrow()
    })

    setup('Authenticate', async ({ page }) => {
        await closePopupsIfExist(page)
        await logInWithUser1(page)
        await storeStorageStateAndToken(page)
    })
})
