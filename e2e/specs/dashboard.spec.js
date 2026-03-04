describe('Dashboard E2E Tests', () => {
    it('should display the dashboard page header with correct title and subtitle', async () => {
        const title = await $('ox-page-header h1');
        await title.waitForExist({ timeout: 10000 });
        expect(await title.getText()).toEqual('Dashboard');

        const subtitle = await $('ox-page-header p');
        await subtitle.waitForExist({ timeout: 5000 });
        expect(await subtitle.getText()).toEqual('Overview of your exams and statistics');
    });

    it('should display all four statistics cards', async () => {
        const statsLabels = [
            'Total Exams',
            'Active Exams',
            'Avg. Questions',
            'Avg. Success Score'
        ];

        for (const label of statsLabels) {
            const cardLabel = await $(`p=${label}`);
            await cardLabel.waitForExist({ timeout: 5000 });
            expect(await cardLabel.isDisplayed()).toBeTruthy();
        }
    });

    it('should display the status distribution section with all status types', async () => {
        const statusTitle = await $('h3=Status Distribution');
        await statusTitle.waitForExist({ timeout: 5000 });
        expect(await statusTitle.isDisplayed()).toBeTruthy();

        const statuses = ['Active', 'Draft', 'Inactive', 'Archived'];
        for (const status of statuses) {
            const statusElement = await $(`span=${status}`);
            await statusElement.waitForExist({ timeout: 2000 });
            expect(await statusElement.isDisplayed()).toBeTruthy();
        }
    });

    it('should display the welcome card with title and description', async () => {
        const welcomeTitle = await $('h3=Welcome to OpenXAM');
        await welcomeTitle.waitForExist({ timeout: 5000 });
        expect(await welcomeTitle.isDisplayed()).toBeTruthy();

        const welcomeText = await $('p=Manage your exams, questions, and certifications in one place. Use the sidebar to navigate through the different sections of the application.');
        await welcomeText.waitForExist({ timeout: 2000 });
        expect(await welcomeText.isDisplayed()).toBeTruthy();
        
        const infoText = await $('p=Quick access to all your created learning materials and exam sets.');
        await infoText.waitForExist({ timeout: 2000 });
        expect(await infoText.isDisplayed()).toBeTruthy();
    });
});
