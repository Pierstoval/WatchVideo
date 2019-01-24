const puppeteer = require('puppeteer');

const headless = true;

var tipeeePageUrl = process.argv[2],
    tipeeeUsername = process.argv[3],
    tipeeePassword = process.argv[4];

process.stdout.write('Url to promote: '+tipeeePageUrl+"\n");

var sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

async function start() {
    if (
        !tipeeePageUrl
        || !tipeeeUsername
        || !tipeeePassword
        || ('USERNAME' === tipeeeUsername)
        || ('PASSWORD' === tipeeePassword)
    ) {
        process.stderr.write("\n/!\\ Please add necessary values when running the script. The command should look like this:\n");
        process.stderr.write("\n command [tipeee url] [tipeee username] [tipeee password]");
        process.stderr.write("\n");
        process.stderr.write("\nExamples:");
        process.stderr.write("\n tipeee.js https://fr.tipeee.com/the-project-you-want-to-help my_username My5up4rP4ssw0rd");
        process.stderr.write("\n tipeee.exe https://fr.tipeee.com/the-project-you-want-to-help my_username My5up4rP4ssw0rd");
        process.stderr.write("\n");
        process.stderr.write("\nWe don't store any password. Check the source code of this project if you want to be sure of it.\n");
        process.exit(1);
    }

    if (!tipeeePageUrl || !tipeeeUsername || !tipeeePassword) {
        process.stdout.write("\nCredentials were not correctly injected.");
        process.stdout.write("\nThis is an app problem, contact the maintainer (or fix this yourself if you know how to do it.");
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: headless,
        executablePath: process.env['chrome_path'] || null,
        args: ['--mute-audio']
    });
    const pages = await browser.pages();
    const page = pages[0];

    process.stdout.write("\nOpening login page...");
    await page.goto('https://fr.tipeee.com/login');

    process.stdout.write("\nRetrieving iframe...");
    const frame = await page.frames().find((f) => f._navigationURL === 'https://oauth.tipeee.com/login');

    process.stdout.write("\nFilling username...");
    const usernameInput = await frame.$('input[name="_username"]');
    await usernameInput.type(tipeeeUsername);

    process.stdout.write("\nFilling password...");
    const passwordInput = await frame.$('input[name="_password"]');
    await passwordInput.type(tipeeePassword);

    process.stdout.write("\nSubmitting form...");
    await passwordInput.press('Enter');

    process.stdout.write("\nClicking on submit button...");
    const submitButton = await frame.$('input[type="submit"]');
    await submitButton.click({delay: 100});

    process.stdout.write("\nWaiting for redirection to finish...");
    await page.waitForNavigation();

    process.stdout.write("\nGoing to next page...");
    await page.goto(tipeeePageUrl);

    process.stdout.write("\nClicking fake player link...");
    const fakePlayerLink = await page.$('.fake-player a');
    await fakePlayerLink.click();

    process.stdout.write("\nWaiting just until clips list is available..");
    await page.waitForSelector('#clip-container .clip');

    /** Click "loop" until no more clips can be watched */

    await clickClip(browser, page, 0);

    /** End of process */

    process.stdout.write("\nClosing browser...");
    await browser.close();

    process.stdout.write("\nDone!");
}

async function clickClip(browser, page, nested) {
    nested++;

    process.stdout.write("\n(It's the nested loop call number "+nested+" , be careful of your memory and stuff!)");

    process.stdout.write("\nCheck if at least one clip is available..");
    try {
        await page.waitForSelector('#clip-container .clip:not(.watched)', {timeout: 6000});
    } catch (e) {
        await waitUntilNewVideoAvailable(browser, page, nested);
        return;
    }

    process.stdout.write("\nClicking first clip link...");
    const firstClip = await page.$('#clip-container .clip:not(.watched)');
    await firstClip.click();

    process.stdout.write("\nWaiting until play button appears..");
    await page.waitForSelector('.playBtn');

    process.stdout.write("\nClicking first clip link...");
    const playButton = await page.$('.playBtn');
    await playButton.click();

    process.stdout.write("\nRetrieving youtube iframe...");
    await page.waitForSelector('iframe#player');

    process.stdout.write("\nWait a few seconds so the player can _really_ appear (seems we can't wait properly)...");
    await sleep(3000);

    process.stdout.write("\nFetch Youtube play button...");
    const pageFrames = await page.frames();
    const youtubeFrame = await pageFrames.find((f) => {return (f._navigationURL||'').match(/youtube\.com\/embed/g);});

    process.stdout.write("\nClick PLAY...");
    const youtubePlayButton = await youtubeFrame.$('.ytp-large-play-button');
    await youtubePlayButton.click();

    process.stdout.write("\nWait 80s (just in case) for the player to finish playing...");
    await sleep(80000);
    process.stdout.write("\nEnough wait! The \"back to list\" button should be here now...");
    try {
        await page.waitForSelector('a.backToList');

        process.stdout.write("\nFinished watching video! \\o/ ♥");
        process.stdout.write("\nWaiting 30 seconds maximum until another clip is available");
    } catch (e) {
        process.stdout.write("\nWell, it's not...");
        await waitUntilNewVideoAvailable(browser, page, nested);
        return;
    }

    try {
        await clickClip(browser, page, nested);
    } catch (e) {
        process.stdout.write("\nAn error occured:");
        process.stdout.write("\n");
        process.stdout.write("\n"+e.toString());
        process.stdout.write("\n");
        process.stdout.write("\nClosing browser...");
        browser.close();
    }
}

async function waitUntilNewVideoAvailable(browser, page, nested) {
    process.stdout.write("\nSeems like you can't watch any more video for now...");
    process.stdout.write("\nLet's wait 10 minutes starting from now ("+(Date().toString())+")...");
    await sleep(600000);

    await page.reload();

    process.stdout.write("\nClicking fake player link...");
    const fakePlayerLink = await page.$('.fake-player a');
    await fakePlayerLink.click();

    await clickClip(browser, page, nested);
}

// Execute:

(async () => {

    await start();
})();
