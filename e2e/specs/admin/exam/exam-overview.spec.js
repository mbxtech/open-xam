describe('Exams Overview', () => {

    beforeEach(async () => {
        const adminLink = await $('nav').$('a[routerLink="/exam/overview"]');
        await adminLink.click();

        await expect(browser).toHaveUrl(expect.stringContaining('/exam/overview'));
    });

    it('should display the statistics header with four cards', async () => {
        const statisticsHeader = await $('#exam-overview-statistics-header');
        await statisticsHeader.waitForExist({ timeout: 10000 });
        expect(await statisticsHeader).toBeDisplayed();

        const labels = await statisticsHeader.$$('.text-caption');

        expect(labels[0]).toHaveText('Total');
        expect(labels[1]).toHaveText('Active');
        expect(labels[2]).toHaveText('Draft');
        expect(labels[3]).toHaveText('Archive');
    });

    it('should display search and filter controls', async () => {
        const searchInput = await $('ox-exam-overview-controls ox-input input');
        expect(searchInput).toExist();
        expect(searchInput).toHaveAttribute('placeholder', 'Search exams...');

        const statusSelect = await $('ox-exam-overview-controls select');
        expect(statusSelect).toExist();

        const options = await statusSelect.$$('option');
        let optionValues = [];

        for (let opt of options) {
            optionValues.push(await opt.getValue());
        }


        expect(optionValues).toContain('ALL');
        expect(optionValues).toContain('ACTIVE');
        expect(optionValues).toContain('DRAFT');
        expect(optionValues).toContain('ARCHIVED');
    });

    it('should display action buttons (New Exam and Import)', async () => {
        const newExamBtn = await $('button=New Exam');
        expect(newExamBtn).toExist();

        const importBtn = await $('button=Import');
        expect(importBtn).toExist();
    });
});