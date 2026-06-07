export const scrollToBottom = async () => browser.execute(() => window.scrollTo(0, document.body.scrollHeight));

export const toggleStickyBottombar = async () => browser.execute(() => document.getElementById('toggle-sticky-bottombar').click());


export async function getToast(index = 0) {
  // 1. Wait for the container to exist
  const container = await $('#toast-container');
  await container.waitForDisplayed({ timeout: 10000 });

  // 2. Wait for the specific toast item
  const toast = await $(`#toast-${index}`);
  await toast.waitForDisplayed({ timeout: 10000 });

  // 3. Wait until text is actually rendered (the key step)
  const titleEl = await $(`#toast-title-${index}`);
  await browser.waitUntil(
    async () => (await titleEl.getText()).trim() !== '',
    { timeout: 10000, interval: 50 }
  );

  return {
    title:   await $(`#toast-title-${index}`).getText(),
    message: await $(`#toast-message-${index}`).getText(),
    date:    await $(`#toast-date-${index}`).getText(),
    close:   await $(`#toast-close-${index}`),
  };
}

export const addQuestion = async (index, typeLabel) => {
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