describe('Admin Pages', () => {
    describe('Exams Overview', () => {
        beforeEach(async () => {
            await browser.url('/admin/exam/overview');
            const statsHeader = await $('ox-statistics-header');
            await statsHeader.waitForExist({ timeout: 10000 });
        });

        it('should display the statistics header with four cards', async () => {
            const statsCards = await $$('ox-statistics-header ox-card');
            expect(statsCards).toBeElementsArrayOfSize(4);

            const labels = await $$('ox-statistics-header .text-caption');
            const labelTexts = await Promise.all(labels.map(label => label.getText()));
            expect(labelTexts).toContain('Total');
            expect(labelTexts).toContain('Active');
            expect(labelTexts).toContain('Draft');
            expect(labelTexts).toContain('Archive');
        });

        it('should display search and filter controls', async () => {
            const searchInput = await $('ox-exam-overview-controls ox-input input');
            expect(searchInput).toExist();
            expect(searchInput).toHaveAttribute('placeholder', 'Search exams...');

            const statusSelect = await $('ox-exam-overview-controls select');
            expect(statusSelect).toExist();

            const options = await statusSelect.$$('option');
            const optionValues = await Promise.all(options.map(opt => opt.getValue()));
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

    describe('Categories Admin', () => {
        beforeEach(async () => {
            await browser.url('/admin/categories');
            const statsHeader = await $('ox-categories-statistics-header');
            await statsHeader.waitForExist({ timeout: 10000 });
        });

        it('should display the categories statistics header', async () => {
            const statsCards = await $$('ox-categories-statistics-header ox-card');
            expect(statsCards).toBeElementsArrayOfSize(3);

            const labels = await $$('ox-categories-statistics-header .text-sm.text-subtext-color');
            const labelTexts = await Promise.all(labels.map(label => label.getText()));
            expect(labelTexts).toContain('Total');
            expect(labelTexts).toContain('In use');
            expect(labelTexts).toContain('Unused');
        });

        it('should display category search and "New Category" button', async () => {
            const searchInput = await $('ox-category-controls ox-input input');
            expect(searchInput).toExist();

            const newCategoryBtn = await $('button=New Category');
            expect(newCategoryBtn).toExist();
        });

        it('should toggle "Create Category" mode', async () => {
            const newCategoryBtn = await $('button=New Category');
            await newCategoryBtn.click();

            const createCard = await $('ox-card*=Name of category...');
            expect(createCard).toExist();

            const abortBtn = await createCard.$('button=Abort');
            expect(abortBtn).toExist();

            const saveBtn = await createCard.$('button=Save');
            expect(saveBtn).toExist();
            expect(saveBtn).toBeDisabled();
        });
    });
});
