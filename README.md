Watch video
===========

## Disclaimer

This tool is meant to be used ONLY FOR DEMONSTRATION AND LEARNING.

It's not suitable for most cases because it's quite unstable, and any abuse coming from this tool is the responsibility of the person that uses it, not the maintainer of this package.

## How to use

Download latest release in the [releases page of this repository](https://github.com/Pierstoval/WatchVideo/releases), execute `watch_video.exe` and you're set!

For now, it works only on Windows.

## Use it in dev

Clone the repository and run this:

```
$ npm install
$ node index.js [url] [username] [password]
```

## Build the executable (on Windows)

After cloning & installing the repository, execute it at least once with `node index.js ...`.

This will make Puppeteer create the chrome executable in its local environment.

Then, install [pkg](https://github.com/zeit/pkg) on your machine, this is how the `exe` file is built.

Then, run `build`, and `pkg` will create the `build/watch_video.exe` file, and the chrome directory will be copied to `build/chrome-win`.

This is the method that is used to generate the releases.
