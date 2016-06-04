# YANGTSE

### Yet Another aNGular Two Starter, with Express.js this time

---

A node.js based, client/server solution showing how to start up a project involving following technologies:

* [Express.js](http://expressjs.com/) to serve web pages,
* [Angular 2](https://angular.io/) framework for client-side Single Page Application,
* [TypeScript](http://www.typescriptlang.org/) as an alternative to JavaScript to write client code,
* [WebPack](https://webpack.github.io/) module bundler to process and build client source files,
* WebPack [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) to
re-compile and reload web page when client source code changes,
* [Karma](https://karma-runner.github.io) test runner and [Jasmine](http://jasmine.github.io/) BDD
testing library to unit test client source code.

## Credits

This project draws from the experience and hints given by other, earlier Angular 2 starter projects.
You might want to have a look at those, in case they might better suits your needs. Among the others, there are:

* [AngularClass/angular2-webpack-starter](https://github.com/AngularClass/angular2-webpack-starter)
* [preboot/angular2-webpack](https://github.com/preboot/angular2-webpack)
* [wkwiatek/angular2-webpack2](https://github.com/wkwiatek/angular2-webpack2)

## Prerequisites

Here are the tools that should be present in your development environment in order to work with this project:

### node.js environment

Server side application relies on node.js to run. Client side application relies on JavaScript and TypeScript,
but it needs node.js anyway to be built and processed.

* [nvm-windows](https://github.com/coreybutler/nvm-windows) 1.1.0, a node.js version management utility for Windows by Corey Butler
* node.js 4.3.2
* npm 3.8.0

## Quick start

Clone or download this repository:

~~~bash
git clone --depth 1 https://github.com/BrainCrumbz/YANGTSE.git
cd YANGTSE
~~~

Install dependencies:

~~~bash
npm install
~~~

Serve application in development, with live reload and module replacement enabled:

~~~bash
npm start
~~~

Launch browser and go to `http://localhost:3000/`.

## Available commands

This project has a number of `npm`-based commands in order to build and run both client and server
source code.

### Install

Install all dependencies:

~~~bash
npm install
~~~

Uninstall all dependencies:

~~~bash
npm uninstall
~~~

### Build

Build for development:

~~~bash
npm run build  # or npm run build-dev
~~~

Build for production:

~~~bash
npm run build-prod
~~~

Clean build output:

~~~bash
npm run clean
~~~

Clean build output and all dependencies:

~~~bash
npm run clean-deep
~~~

Before building, output will be automatically cleaned. No need to manually clean.

### Serve

Serve application in development, with live reload and module replacement enabled:

~~~bash
npm start  # or npm run serve, or npm run serve-dev
~~~

Serve application in production:

~~~bash
npm run serve-prod
~~~

Before serving, application will be automatically rebuilt. No need to manually build.

### Test

Test:

~~~bash
npm test  # or npm run test
~~~

Test with debugging enabled (e.g. breakpoints in browser console):

~~~bash
npm run test-debug
~~~

Test in watch mode (keep running tests again when code changes):

~~~bash
npm run test-watch
~~~

## License

[MIT](LICENSE)
