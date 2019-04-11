/*
General purpose plugin update tool.

For now, updates a plugin from pre-iframe to iframe.

- ensure that the given directory is a plugin
  - inspect the package.json file
  - config for kbase-ui has a config field plugin-version
    - if it is undefined, assume it is not iframe
    - if it is 2.0.0, assume it is already converted, exit
  - copy assets in from the plugins-assets directory
*/

const yargs = require('yargs');
const exec = require('child_process').execSync;
const chalk = require('chalk');
const fs = require('fs-extra');
const glob = require('glob');

function usage() {
    console.log();
}

function log(msg) {
    var line = 'ℹ : ' + new Date().toISOString() + ': ' + msg;
    var chalked = chalk.blue(line);
    process.stdout.write(chalked);
    process.stdout.write('\n');
}

function logWarning(msg) {
    var line = '⚠ : ' + new Date().toISOString() + ': ' + msg;
    var chalked = chalk.yellow(line);
    process.stdout.write(chalked);
    process.stdout.write('\n');
}

function logError(msg) {
    var line = '⛔ : ' + new Date().toISOString() + ': ' + msg;
    var chalked = chalk.red(line);
    process.stdout.write(chalked);
    process.stdout.write('\n');
}

function logSuccess(msg) {
    var line = '✔ : ' + new Date().toISOString() + ': ' + msg;
    var chalked = chalk.green(line);
    process.stdout.write(chalked);
    process.stdout.write('\n');
}

function copyLinting(rootDir, pluginDir) {
    const lintingFilename = '.eslintrc.yml';
    const lintingFrom = [rootDir, 'assets', lintingFilename].join('/');
    const lintingTo = [pluginDir, lintingFilename].join('/');

    if (!fs.existsSync(lintingFrom)) {
        logError('ES Lint file does not exist: ' + lintingFrom);
        process.exit(1);
    }

    log('copying');
    log('from: ' + lintingFrom);
    log('to  :' + lintingTo);

    fs.copyFileSync(lintingFrom, lintingTo);
}

function copyBuildDir(rootDir, pluginDir) {
    const files = ['bower.json', 'Gruntfile.js', 'package-lock.json', 'package.json', 'README.md'];
    const copyFrom = [rootDir, 'assets', 'plugin', 'build'].join('/');
    const copyTo = [pluginDir, 'build'].join('/');

    if (!fs.existsSync(copyFrom)) {
        logError('Build directory does not exist: ' + copyFrom);
        process.exit(1);
    }
    logSuccess('Tools build directory found');

    if (!fs.existsSync(copyTo)) {
        logWarning('Plugin build directory does not exist, creating');
        fs.mkdirSync(copyTo);
        logSuccess('Build source directory created: ' + copyTo);
    }
    logSuccess('Plugin build directory found');

    files.forEach((file) => {
        const from = [copyFrom, file].join('/');
        const to = [copyTo, file].join('/');
        if (!fs.existsSync(from)) {
            logError('Build source file does not exist: ' + from);
        }
        log('Copying: ' + file);
        try {
            fs.copyFileSync(from, to);
            logSuccess('Copied: ' + file);
        } catch (ex) {
            logError('Error copying file: ' + file);
            logError(ex.message);
        }
    });
}

function copyHostSupport(rootDir, pluginDir) {
    // Modules
    const files = ['iframer.js', 'panel.css', 'panel.js', 'windowChannel.js'];
    const copyFrom = [rootDir, 'assets', 'plugin', 'host_support', 'modules'].join('/');
    const copyTo = [pluginDir, 'src', 'plugin', 'modules'].join('/');

    if (!fs.existsSync(copyFrom)) {
        logError('Host Support directory does not exist: ' + copyFrom);
        process.exit(1);
    }
    logSuccess('Host Support directory found');

    if (!fs.existsSync(copyTo)) {
        logWarning('Plugin modules directory does not exist, creating');
        fs.mkdirSync(copyTo);
        logSuccess('Build modules directory created: ' + copyTo);
    }
    logSuccess('Plugin modules directory found');

    files.forEach((file) => {
        const from = [copyFrom, file].join('/');
        const to = [copyTo, file].join('/');
        if (!fs.existsSync(from)) {
            logError('Host Support source file does not exist: ' + from);
        }
        log('Copying: ' + file);
        try {
            fs.copyFileSync(from, to);
            logSuccess('Copied: ' + file);
        } catch (ex) {
            logError('Error copying file: ' + file);
            logError(ex.message);
        }
    });

    // for now skip the config.yml file.
}

function copyIframeSupport(rootDir, pluginDir) {
    const copyFrom = [rootDir, 'assets', 'plugin', 'iframe_support'].join('/');
    const copyTo = [pluginDir, 'src', 'plugin', 'iframe_root'].join('/');
    const except = ['css/main.css', 'modules/config.yml', 'index.css', 'index.html'];

    if (!fs.existsSync(copyFrom)) {
        logError('iFrame Support directory does not exist: ' + copyFrom);
        process.exit(1);
    }
    logSuccess('iFrame Support directory found');

    files = glob.sync([copyFrom, '**/*'].join('/'));
    files.forEach((file) => {
        const relativePathname = file.substr(copyFrom.length + 1);
        if (except.includes(relativePathname)) {
            logWarning('Skipping file: ' + relativePathname);
            return;
        }
        const from = [copyFrom, relativePathname].join('/');
        const to = [copyTo, relativePathname].join('/');
        if (!fs.existsSync(from)) {
            logError('iFrame Support file does not exist: ' + from);
            process.exit(1);
        }
        if (fs.existsSync(to)) {
            log('Replacing file: ' + relativePathname);
        }
        log('Copying: ' + file);
        try {
            // TODO: ensure directories for the destination exist
            //       for updates, this covers new directories
            //       for install, this covers everything.
            fs.copyFileSync(from, to);
            logSuccess('Copied: ' + file);
        } catch (ex) {
            logError('Error copying file: ' + file);
            logError(ex.message);
        }
    });
}

function main({ plugin }) {
    if (!plugin) {
        usage();
        throw new Error('Plugin argument required');
    }
    function getRoot() {
        const out = exec('git rev-parse --show-toplevel', {
            encoding: 'utf8'
        });
        return out.trim();
    }

    const rootDir = getRoot();
    const pluginDir = [rootDir, '..', 'kbase-ui-plugin-' + plugin].join('/');
    if (!fs.existsSync(pluginDir)) {
        logError('Plugin directory does not exist: ' + pluginDir);
        process.exit(1);
    }
    logSuccess('Plugin repo found: ' + pluginDir);

    log('root dir: ' + rootDir);

    log('plugin: ' + plugin);

    // sync linting
    // copyLinting(rootDir, pluginDir);

    // sync build tool
    // copyBuildDir(rootDir, pluginDir);

    // sync host support, other than config.yml
    // copyHostSupport(rootDir, pluginDir);

    // sync iframe support: css, modules/kbaseUI,
    // not index.html, index.css
    // main.js is handled
    copyIframeSupport(rootDir, pluginDir);
}

const args = yargs.parse(process.argv.slice(2));

main(args);
