import {exec} from "child_process";

describe('OpenXAM Startpage', () => {
    it('should display the dashboard with welcome message', async () => {
        const welcomeHeader = await $('h3=Welcome to OpenXAM');
        await welcomeHeader.waitForExist({ timeout: 10000 });
        
        const text = await welcomeHeader.getText();
        expect(text).to.equal('Welcome to OpenXAM');
    });

    it('should show the dashboard title in the page header', async () => {
        const pageHeader = await $('ox-page-header h1');
        await pageHeader.waitForExist({ timeout: 5000 });
        
        const title = await pageHeader.getText();
        expect(title).to.equal('Dashboard');
    });
});
