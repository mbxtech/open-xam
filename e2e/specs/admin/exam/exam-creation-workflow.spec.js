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

    const addAnswerBtn = await questionCard.$('ox-button button[data-testid="add-answer-btn"]');
    await addAnswerBtn.scrollIntoView();

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


describe('Exam Workflow', () => {
    it('should navigate to exam overview', async () => {
        const adminLink = await $('nav').$('a[routerLink="/exam/overview"]');
        await adminLink.click();

        await expect(browser).toHaveUrl(expect.stringContaining('/exam/overview'));
    });

    it('should open new exam page', async () => {
        const newExamBtn = await $('button=New Exam');
        await newExamBtn.click();

        await expect(browser).toHaveUrl(expect.stringContaining('/exam/edit'));
    });

    it('should fill in exam attribute', async () => {
        const nameInput = await $('ox-basic-input[label="Name"] input');
        await nameInput.setValue('Workflow Test Exam');

        const descriptionInput = await $('ox-basic-input[label="Description"] input');
        await descriptionInput.setValue('An exam with all question types created by automated test.');

        const pointsInput = await $('ox-basic-input[label="Points to succeed"] input');
        await pointsInput.setValue(10);

        const durationInput = await $('ox-basic-input[label="Duration for real exam in minutes"] input');
        await durationInput.setValue(60);

        const questionsRealExamInput = await $('ox-basic-input[label="Max questions for real exam"] input');
        await questionsRealExamInput.setValue(4);
        await scrollToBottom();
    });

    it('should add question type single choice', async () => {
        const questionSingleChoice = await addQuestion(0, 'Single choice');
        const qscAddAnswerBtn = await questionSingleChoice.$('button=Add answer');
        await qscAddAnswerBtn.click();
        const qscAnswer1 = await questionSingleChoice.$('ox-answer-form form:nth-child(1) textarea');
        await qscAnswer1.setValue('Correct Answer');
        const qscCorrectRadio = await questionSingleChoice.$('ox-answer-form form:nth-child(1) input[data-testid="single-choice-is-correct-radio"] + label');
        await qscCorrectRadio.click();

        await qscAddAnswerBtn.click();
        const q1Answer2 = await questionSingleChoice.$('ox-answer-form form:nth-child(2) textarea');
        await q1Answer2.setValue('Wrong Answer');

        await scrollToBottom();
    });

    it('should add question type multiple choice', async () => {
        const q2 = await addQuestion(1, 'Multiple choice');
        const q2AddAnswerBtn = await q2.$('button=Add answer');
        await q2AddAnswerBtn.click();
        const q2Answer1 = await q2.$('ox-answer-form form:nth-child(1) textarea');
        await q2Answer1.setValue('Correct Answer 1');
        const q2CorrectCheck1 = await q2.$('ox-answer-form form:nth-child(1) #is-correct-checkbox');
        await q2CorrectCheck1.click();

        await q2AddAnswerBtn.click();
        await scrollToBottom();
        const q2Answer2 = await q2.$('ox-answer-form form:nth-child(2) textarea');
        await q2Answer2.setValue('Correct Answer 2');
        const q2CorrectCheck2 = await q2.$('ox-answer-form form:nth-child(2) #is-correct-checkbox');
        await q2CorrectCheck2.click();

        await scrollToBottom();
    });

    it('should add question type assignment', async () => {
        const q3 = await addQuestion(2, 'Assigment');
        await browser.execute(() => window.scrollTo(0, document.body.scrollHeight));
        const q3AddOptionBtn = await q3.$('button=Add Option');
        await q3AddOptionBtn.click();
        await browser.execute(() => window.scrollTo(0, document.body.scrollHeight));
        const q3Option1 = await q3.$('ox-assignment-option ox-card:nth-child(1)');
        const q3Option1Input = await q3.$(
            'ox-assignment-option ox-card input[placeholder="e.g. Context or Term"]'
        );
        await q3Option1Input.setValue('Term 1');

        const q3Option1AnswerBtn = await q3Option1.$('button=Add answer');
        await q3Option1AnswerBtn.click();
        await browser.execute(() => window.scrollTo(0, document.body.scrollHeight));
        const q3Option1Answer = await q3Option1.$('ox-answer-form form:nth-child(1) textarea');
        await q3Option1Answer.setValue('Definition 1');
        await q3Option1AnswerBtn.click();
        await browser.execute(() => window.scrollTo(0, document.body.scrollHeight));
        const q3Option2Answer = await q3Option1.$('ox-answer-form form:nth-child(2) textarea');
        await q3Option2Answer.setValue('Definition 2');
        await scrollToBottom();
    });

    it('should save exam and navigate to overview', async () => {
        const saveBtn = await $('ox-sticky-bottom-bar').$('button=Save');
        await expect(saveBtn).toBeEnabled();
        await saveBtn.click();

        await expect(browser).toHaveUrl(expect.stringContaining('/exam/overview'));
        await browser.waitUntil(
            async () => (await browser.getUrl()).endsWith('/exam/overview'),
            {timeout: 10000, timeoutMsg: 'Never navigated to overview'}
        );

        const examTitle = await $('h3=Workflow Test Exam');
        await expect(examTitle).toExist();

        const examDescription = await $('p=An exam with all question types created by automated test.');
        await expect(examDescription).toExist();
    });

    it('should have toast message after saving exam', async () => {

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

        const toastTitle = await $('#toast-title-0');
        await toastTitle.waitForDisplayed({ timeout: 5000 })
        await expect(toastTitle).toBeDisplayed();

        const toastMessage = await $('#toast-message-0');
        toastMessage.waitForDisplayed({ timeout: 5000 })
        await expect(toastMessage).toBeDisplayed();

        const toastCloseBtn = await $('#toast-close-0');
        expect(toastCloseBtn.isClickable()).toBeTruthy();
        await toastCloseBtn.click();

        await expect(await $('#toast-0')).not.toExist();
    })
});
