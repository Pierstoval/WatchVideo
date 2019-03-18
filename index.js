const puppeteer = require('puppeteer');
const prompt = require('prompt-promise');

const headless = true;

var tipeeePageUrl = process.argv[2] || '',
    tipeeeUsername = process.argv[3] || '',
    tipeeePassword = process.argv[4] || '';

var sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

process.stdout.write("Press CTRL+C to stop the program.\n");

async function start() {
    if (
        !tipeeePageUrl.trim()
        || !tipeeeUsername.trim()
        || !tipeeePassword.trim()
        || ('USERNAME' === tipeeeUsername.toUpperCase())
        || ('PASSWORD' === tipeeePassword.toUpperCase())
    ) {
        do {
            tipeeePageUrl = await prompt('Tipeee page URL: ');
            if (tipeeePageUrl && !tipeeePageUrl.match(/^https?:\/\/(fr|en)\.tipeee\.com\//gi)) {
                process.stdout.write("URL must start with a Tipeee url like \"https://fr.tipeee.com/\"\n");
                tipeeePageUrl = null;
            }
            tipeeePageUrl = (tipeeePageUrl || '').trim();
        } while (!tipeeePageUrl);

        do {
            tipeeeUsername = await prompt('Username or email: ');
            tipeeeUsername = (tipeeeUsername || '').trim();
        } while (!tipeeeUsername);

        do {
            tipeeePassword = await prompt.password('Password: ');
        } while (!tipeeePassword);
    }

    const browser = await puppeteer.launch({
        headless: headless,
        executablePath: process.env['chrome_path'] || null,
        args: ['--mute-audio']
    });
    const pages = await browser.pages();
    const page = pages[0];

    process.stdout.write("\nOpening login page...");
    try {
        await page.goto('https://fr.tipeee.com/login');
    } catch (e) {
        process.stderr.write("\nCan't reach login page :(");
        process.exit(1);
    }

    process.stdout.write("\nRetrieving iframe...");
    let frame;
    try {
        frame = await page.frames().find((f) => f._navigationURL === 'https://oauth.tipeee.com/login');
    } catch (e) {
        frame = null;
    }
    if (!frame) {
        process.stderr.write("\nSeems we can't find the login wrapper...");
        process.exit(1);
        return;
    }

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
    try {
        await page.waitForNavigation();
    } catch (e) {
        process.stderr.write("\nSeems like your username or email is wrong...");
        process.exit(1);
    }

    process.stdout.write("\nGoing to next page...");
    await page.goto(tipeeePageUrl);

    process.stdout.write("\nClicking fake player link...");
    const fakePlayerLink = await page.$('.fake-player a');
    await fakePlayerLink.click();

    process.stdout.write("\nWaiting until clips list is available...");
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
    process.stdout.write("\nSince videos can be seen only every hour, we'll refresh in 10 minutes to see if another can be watched...");
    process.stdout.write("\nLet's wait a bit (started waiting at: "+(Date().toString())+")...");
    await sleep(600000);

    await page.reload();

    process.stdout.write("\nClicking fake player link...");
    const fakePlayerLink = await page.$('.fake-player a');
    await fakePlayerLink.click();

    await clickClip(browser, page, nested);
}

// Execute:

(async () => {
    let failures = 0;
    while (true) {
        try {
            await start();
        } catch (e) {
            failures++;
            process.stderr.write("\n===================================================");
            process.stderr.write("\n===================================================");
            process.stderr.write("\n Whole process failed "+failures+" time(s). Error:");
            process.stderr.write("\n "+(e.message || e.toString()));
            process.stderr.write("\n Restarting...");
            process.stderr.write("\n===================================================");
            process.stderr.write("\n===================================================");
        }
    }
})();
