import { test as setup } from '@playwright/test';

import { closePopupsIfExist, logInWithUser1, storeStorageStateAndToken } from './helpers/loginHelpers';

setup('authenticate', async ({ page }) => {
    await logInWithUser1(page)
    await closePopupsIfExist(page)
    await storeStorageStateAndToken(page)
}) 