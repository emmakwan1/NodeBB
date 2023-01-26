'use strict';
exports.__esModule = true;
var fs = require('fs');
var childProcess = require('child_process');
var chalk = require('chalk');
var fork = require('../meta/debugFork');
var paths = require('../constants').paths;
var cwd = paths.baseDir;
function getRunningPid(callback) {
    fs.readFile(paths.pidfile, {
        encoding: 'utf-8'
    }, function (err, data) {
        if (err) {
            return callback(err);
        }
        var pid = parseInt(data, 10);
        try {
            process.kill(pid, 0);
            callback(null, pid);
        }
        catch (e) {
            callback(e);
        }
    });
}
function start(options) {
    if (options.dev) {
        process.env.NODE_ENV = 'development';
        fork(paths.loader, ['--no-daemon', '--no-silent'], {
            env: process.env,
            stdio: 'inherit',
            cwd: cwd
        });
        return;
    }
    if (options.log) {
        console.log("\n".concat([
            chalk.bold('Starting NodeBB with logging output'),
            chalk.red('Hit ') + chalk.bold('Ctrl-C ') + chalk.red('to exit'),
            'The NodeBB process will continue to run in the background',
            "Use \"".concat(chalk.yellow('./nodebb stop'), "\" to stop the NodeBB server"),
        ].join('\n')));
    }
    else if (!options.silent) {
        console.log("\n".concat([
            chalk.bold('Starting NodeBB'),
            "  \"".concat(chalk.yellow('./nodebb stop'), "\" to stop the NodeBB server"),
            "  \"".concat(chalk.yellow('./nodebb log'), "\" to view server output"),
            "  \"".concat(chalk.yellow('./nodebb help'), "\" for more commands\n"),
        ].join('\n')));
    }
    // Spawn a new NodeBB process
    var child = fork(paths.loader, process.argv.slice(3), {
        env: process.env,
        cwd: cwd
    });
    if (options.log) {
        childProcess.spawn('tail', ['-F', './logs/output.log'], {
            stdio: 'inherit',
            cwd: cwd
        });
    }
    return child;
}
function stop() {
    getRunningPid(function (err, pid) {
        if (!err) {
            process.kill(pid, 'SIGTERM');
            console.log('Stopping NodeBB. Goodbye!');
        }
        else {
            console.log('NodeBB is already stopped.');
        }
    });
}
function restart(options) {
    getRunningPid(function (err, pid) {
        if (!err) {
            console.log(chalk.bold('\nRestarting NodeBB'));
            process.kill(pid, 'SIGTERM');
            options.silent = true;
            start(options);
        }
        else {
            console.warn('NodeBB could not be restarted, as a running instance could not be found.');
        }
    });
}
function status() {
    getRunningPid(function (err, pid) {
        if (!err) {
            console.log("\n".concat([
                chalk.bold('NodeBB Running ') + chalk.cyan("(pid ".concat(pid.toString(), ")")),
                "\t\"".concat(chalk.yellow('./nodebb stop'), "\" to stop the NodeBB server"),
                "\t\"".concat(chalk.yellow('./nodebb log'), "\" to view server output"),
                "\t\"".concat(chalk.yellow('./nodebb restart'), "\" to restart NodeBB\n"),
            ].join('\n')));
        }
        else {
            console.log(chalk.bold('\nNodeBB is not running'));
            console.log("\t\"".concat(chalk.yellow('./nodebb start'), "\" to launch the NodeBB server\n"));
        }
    });
}
function log() {
    console.log("".concat(chalk.red('\nHit ') + chalk.bold('Ctrl-C ') + chalk.red('to exit\n'), "\n"));
    childProcess.spawn('tail', ['-F', './logs/output.log'], {
        stdio: 'inherit',
        cwd: cwd
    });
}
exports.start = start;
exports.stop = stop;
exports.restart = restart;
exports.status = status;
exports.log = log;
