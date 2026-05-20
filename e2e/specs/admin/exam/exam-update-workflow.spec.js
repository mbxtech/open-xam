const scrollToBottom = async () => browser.execute(() => window.scrollTo(0, document.body.scrollHeight));

const addQuestion = async (index, typeLabel) => {
    await scrollToBottom();

    await browser.execute(() => {
        document.getElementById('add-question-btn').click();
    });

    const questionCard = await $(`#question-${index}`);
    await questionCard.waitForExist({timeout: 5000});

    const pointsTotalInput = await questionCard.$('ox-basic-input[label="Points"] input');
    await pointsTotalInput.setValue(10);

    const questionTextInput = await questionCard.$('ox-basic-input[label="Question Text"] textarea');
    await questionTextInput.setValue(`Test Question ${index + 1} (${typeLabel})`);

    const typeSelect = await questionCard.$('ox-dynamic-select[label="Question Type"] select');
    const options = await typeSelect.$$('option');
    let optionToSelect;
    for (const option of options) {
        if (await option.getText() === typeLabel) {
            optionToSelect = option;
            break;
        }
    }
    if (optionToSelect) {
        await optionToSelect.click();
    } else {
        throw new Error(`Option with label ${typeLabel} not found`);
    }

    return questionCard;
};

describe('Exam Update Workflow', () => {
    it('should navigate to exam overview (Step 1-2)', async () => {
        const adminLink = await $('nav').$('a[routerLink="/exam/overview"]');
        await adminLink.click();

        await expect(browser).toHaveUrl(expect.stringContaining('/exam/overview'));
        
        // Wait for list to load
        const h3 = await $('h3');
        await h3.waitForExist({ timeout: 10000 });
    });

    it('should click on exam update button (Step 3-4)', async () => {
        // Find the first exam card's edit button
        const updateBtn = await $('ox-button[title="Edit"] button, ox-button button fa-icon[icon*="pencil"]');
        await updateBtn.waitForExist({ timeout: 5000 });
        await updateBtn.click();

        await expect(browser).toHaveUrl(expect.stringContaining('/exam/edit'));
    });

    it('should see all questions (Step 5)', async () => {
        const firstQuestion = await $('#question-0');
        await expect(firstQuestion).toBeDisplayed();
    });

    it('should update exam details (Step 6)', async () => {
        const nameInput = await $('ox-basic-input[label="Name"] input');
        await nameInput.setValue('Updated Workflow Test Exam');

        const descriptionInput = await $('ox-basic-input[label="Description"] input');
        await descriptionInput.setValue('Updated description by automated test.');
    });

    it('should add a new question (Step 7)', async () => {
        const currentQuestionsCount = (await $$('ox-card[id^="question-"]')).length;
        await addQuestion(currentQuestionsCount, 'Single choice');
        
        const newQuestion = await $(`#question-${currentQuestionsCount}`);
        await expect(newQuestion).toBeDisplayed();
    });

    it('should delete an existing question (Step 8-10)', async () => {
        const questionToDelete = await $('#question-0');
        await questionToDelete.scrollIntoView();

        // Use the newly added data-testids
        const contextMenuBtn = await questionToDelete.$('[data-testid="context-menu-button"]');
        await contextMenuBtn.click();

        const deleteBtn = await $('[data-testid="delete-question-btn"]');
        await deleteBtn.waitForDisplayed({ timeout: 5000 });
        await deleteBtn.click();

        // Dialog opens
        const dialog = await $('ox-dialog[title="Delete question"]');
        await dialog.waitForDisplayed({ timeout: 5000 });
        
        // Confirm deletion
        const confirmBtn = await $('[data-testid="dialog-submit-btn"] button');
        await confirmBtn.waitForDisplayed({ timeout: 5000 });
        await confirmBtn.click();

        // Verify it's gone (or at least dialog closed and no errors)
        await dialog.waitForDisplayed({ reverse: true, timeout: 5000 });
    });

    it('should see no errors (Step 11)', async () => {
        // Check for any error toast
        const errorToast = await $('.bg-error-50');
        await expect(errorToast).not.toExist();
    });

    it('should save the changes (Step 12)', async () => {
        const saveBtn = await $('ox-sticky-bottom-bar').$('button=Save');
        await expect(saveBtn).toBeEnabled();
        await saveBtn.click();
    });

    it('should be redirected to exam overview and see toaster (Step 13-14)', async () => {
        await browser.waitUntil(
            async () => (await browser.getUrl()).endsWith('/exam/overview'),
            {timeout: 10000, timeoutMsg: 'Never navigated to overview'}
        );

        let toastElement;
        await browser.waitUntil(
            async () => {
                const html = await $('#toast-container').getHTML();
                if (html.includes('toast-0')) {
                    toastElement = await $('#toast-0');
                    return true;
                }
                return false;
            },
            { timeout: 10000, interval: 500 }
        );

        await expect(toastElement).toBeDisplayed();
        const toastTitle = await toastElement.$('#toast-title-0');
        await expect(toastTitle).toHaveText('Edit Exam result');
        
        const toastMessage = await toastElement.$('#toast-message-0');
        await expect(toastMessage).toHaveText(
            expect.stringContaining('Successfully updated exam')
        );
    });
});
