describe('Navigation', () => {
    it('should navigate to Dashboard', async () => {
        const dashboardLink = await $('nav').$('a[routerLink="/dashboard"]');
        await dashboardLink.click();
        
        await expect(browser).toHaveUrl(expect.stringContaining('/dashboard'));
        const header = await $('ox-page-header h1');
        await expect(header).toHaveText('Dashboard');
    });

    it('should navigate to Administration', async () => {
        const adminLink = await $('nav').$('a[routerLink="/exam/overview"]');
        await adminLink.click();
        
        await expect(browser).toHaveUrl(expect.stringContaining('/exam/overview'));
        const header = await $('ox-statistics-header');
        await expect(header).toExist();
    });

    it('should navigate to Learning', async () => {
        const learningLink = await $('nav').$('a[routerLink="/learning"]');
        await learningLink.click();
        
        await expect(browser).toHaveUrl(expect.stringContaining('/learning'));
        const header = await $('ox-page-header h1');
        await expect(header).toHaveText('Available exams');
    });

    it('should navigate back to Dashboard via logo', async () => {
        // Go somewhere else first
        const adminLink = await $('nav').$('a[routerLink="/exam/overview"]');
        await adminLink.click();

        const logoLink = await $('nav').$('a.flex.items-center');
        await logoLink.click();

        await expect(browser).toHaveUrl(expect.stringContaining('/dashboard'));
    });
});
