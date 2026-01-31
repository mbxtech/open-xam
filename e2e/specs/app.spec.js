import { expect } from 'chai';
import {
  initDriver,
  quitDriver,
  $,
  $id,
  $linkText,
  $buttonText,
  $text,
  setValue,
  waitForElement,
  waitForXpath,
  elementExists,
  xpathExists
} from '../helpers.js';

describe('Exam Simulator App', function() {
  // Increase timeout for all tests in this suite
  this.timeout(60000);

  before(async function() {
    await initDriver();
  });

  after(async function() {
    await quitDriver();
  });

  it('should display the application title', async function() {
    const title = await $linkText('Exam Simulator');
    expect(await title.isDisplayed()).to.be.true;
  });

  it('should navigate to exams overview', async function() {
    const examsLink = await $linkText('Exams');
    await examsLink.click();

    // Check if we are on the Overview page by looking for the heading
    const heading = await waitForXpath("//h1[normalize-space()='Overview of Exams']");
    expect(await heading.isDisplayed()).to.be.true;
  });

  it('should show statistics header on overview page', async function() {
    const statsHeader = await $('ox-statistics-header');
    expect(await statsHeader.isDisplayed()).to.be.true;
  });

  it('should have a create button on overview page', async function() {
    const createBtn = await $buttonText('New Exam');
    expect(await createBtn.isDisplayed()).to.be.true;
  });

  it('should navigate to create exam page', async function() {
    const createBtn = await $buttonText('New Exam');
    await createBtn.click();

    const heading = await waitForXpath("//h1[normalize-space()='New Exam']");
    expect(await heading.isDisplayed()).to.be.true;

    const nameInput = await $id('name');
    expect(await nameInput.isDisplayed()).to.be.true;
  });

  it('should create a new exam with a question and answer', async function() {
    // Navigate to exams overview first
    const examsLink = await $linkText('Exams');
    await examsLink.click();

    // Wait for and click create button
    const createBtn = await waitForXpath("//button[normalize-space()='New Exam']");
    await createBtn.click();

    // Fill in exam details
    const nameInput = await $id('name');
    await nameInput.clear();
    await nameInput.sendKeys('Exam with Question');

    const descInput = await $id('description');
    await descInput.clear();
    await descInput.sendKeys('Selenium Test');

    // The first #score is 'Points to succeed' in the exam form
    const scoreInput = await $id('score');
    await scoreInput.clear();
    await scoreInput.sendKeys('1');

    // Add a question
    const addQuestionBtn = await $buttonText('Add question');
    await addQuestionBtn.click();

    const questionInput = await $id('questionTextControl');
    await questionInput.clear();
    await questionInput.sendKeys('Is this a test?');

    // Add an answer
    const addAnswerBtn = await $buttonText('Add answer');
    await addAnswerBtn.click();

    const answerInput = await $id('answerText');
    await answerInput.clear();
    await answerInput.sendKeys('Yes');

    const correctCheckbox = await $id('correctAnswer');
    await correctCheckbox.click();

    // Submit the form
    const submitBtn = await $buttonText('Submit');
    await submitBtn.click();

    // Check if we are back on Overview
    const heading = await waitForXpath("//h1[normalize-space()='Overview of Exams']");
    expect(await heading.isDisplayed()).to.be.true;

    // Verify the new exam card exists
    const newExamCard = await waitForXpath("//h3[normalize-space()='Exam with Question']");
    expect(await newExamCard.isDisplayed()).to.be.true;
  });
});
