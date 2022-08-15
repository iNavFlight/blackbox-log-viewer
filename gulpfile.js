'use strict';

var pkg = require('./package.json');

var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');

var archiver = require('archiver');
var del = require('del');
var NwBuilder = require('nw-builder');
var semver = require('semver');

var gulp = require('gulp');
var concat = require('gulp-concat');

var os = require('os');

const commandExistsSync = require('command-exists').sync;

var distDir = './dist/';
var appsDir = './apps/';
var debugDir = './debug/';
var releaseDir = './release/';
var destDir;

var platforms = [];

// -----------------
// Helper functions
// -----------------

function getArguments() {
    return minimist(process.argv.slice(2));
}

// Get platform from commandline args
// #
// # gulp <task> [<platform>]+        Run only for platform(s) (with <platform> one of --linux64, --osx64, or --win32 --chromeos)
// # 
function getPlatforms() {
    const defaultPlatforms = ['win32', 'osx64', 'linux64'];
    const platform = getArguments().platform;
    if (platform) {
        if (defaultPlatforms.indexOf(platform) < 0) {
            throw new Error(`Invalid platform "${platform}". Available ones are: ${defaultPlatforms}`)
        }
        return [platform];
    }
    return defaultPlatforms;
}

function execSync() {
    const cmd = arguments[0];
    const args = Array.prototype.slice.call(arguments, 1);
    const result = child_process.spawnSync(cmd, args, {stdio: 'inherit'});
    if (result.error) {
        throw result.error;
    }
}

function getRunDebugAppCommand() {
    switch (os.platform()) {
    case 'darwin':
        return 'open ' + path.join(debugDir, pkg.name, 'osx64', pkg.name + '.app');

        break;
    case 'linux':
        return path.join(debugDir, pkg.name, 'linux64', pkg.name);

        break;
    case 'win32':
        return path.join(debugDir, pkg.name, 'win32', pkg.name + '.exe');

        break;

    default:
        return '';

        break;
    }
}

function get_release_filename_base(platform) {
    return 'INAV-BlackboxExplorer_' + platform;
}

function get_release_filename(platform, ext, addition = '') {
    return get_release_filename_base(platform) + addition + '_' + pkg.version + '.' + ext;
}

function get_nw_version() {
    return semver.valid(semver.coerce(require('./package.json').dependencies.nw));
}

// -----------------
// Tasks
// -----------------

gulp.task('clean-dist', function () { 
    return del([distDir + '**'], { force: true }); 
});

gulp.task('clean-apps', function () { 
    return del([appsDir + '**'], { force: true }); 
});

gulp.task('clean-debug', function () { 
    return del([debugDir + '**'], { force: true }); 
});

gulp.task('clean-release', function () { 
    return del([releaseDir + '**'], { force: true }); 
});

gulp.task('clean-cache', function () { 
    return del(['./cache/**'], { force: true }); 
});

gulp.task('clean', gulp.series(['clean-dist', 'clean-apps', 'clean-debug', 'clean-release']));

// Real work for dist task. Done in another task to call it via
// run-sequence.
gulp.task('dist', gulp.series(['clean-dist'], function () {
    var distSources = [
        // CSS files
        './css/bootstrap-theme.css',
        './css/bootstrap-theme.css.map',
        './css/bootstrap-theme.min.css',
        './css/bootstrap.css',
        './css/bootstrap.css.map',
        './css/bootstrap.min.css',
        './css/header_dialog.css',
        './css/jquery.nouislider.min.css',
        './css/keys_dialog.css',
        './css/main.css',
        './css/user_settings_dialog.css',

        // JavaScript
        './js/cache.js',
        './js/complex.js',
        './js/configuration.js',
        './js/craft_2d.js',
        './js/craft_3d.js',
        './js/datastream.js',
        './js/decoders.js',
        './js/expo.js',
        './js/flightlog.js',
        './js/flightlog_fielddefs.js',
        './js/flightlog_fields_presenter.js',
        './js/flightlog_index.js',
        './js/flightlog_parser.js',
        './js/flightlog_video_renderer.js',
        './js/graph_config.js',
        './js/graph_config_dialog.js',
        './js/graph_legend.js',
        './js/graph_spectrum.js',
        './js/grapher.js',
        './js/header_dialog.js',
        './js/keys_dialog.js',
        './js/laptimer.js',
        './js/main.js',
        './js/pref_storage.js',
        './js/real.js',
        './js/seekbar.js',
        './js/tools.js',
        './js/user_settings_dialog.js',
        './js/video_export_dialog.js',
        './js/vendor/FileSaver.js',
        './js/vendor/bootstrap.js',
        './js/vendor/bootstrap.min.js',
        './js/vendor/jquery-1.11.3.min.js',
        './js/vendor/jquery-ui-1.11.4.min.js',
        './js/vendor/jquery.ba-throttle-debounce.js',
        './js/vendor/jquery.nouislider.all.min.js',
        './js/vendor/modernizr-2.6.2-respond-1.1.0.min.js',
        './js/vendor/npm.js',
        './js/vendor/semver.js',
        './js/vendor/three.js',
        './js/vendor/three.min.js',
        './js/vendor/webm-writer-0.1.1.js',

        // everything else
        './package.json', // For NW.js
        './manifest.json', // For Chrome app
        './background.js',
        './*.html',
        './images/**/*',
        './_locales/**/*',
        './fonts/*',
    ];
    return gulp.src(distSources, { base: '.' })
        .pipe(gulp.dest(distDir))
//TODO: ENABLE IT!
        //.pipe(install({
        //    npm: '--production --ignore-scripts'
        //}))
        ;
}));

// Create runable app directories in ./apps
gulp.task('apps', gulp.series(['dist', 'clean-apps'], function (done) {
    platforms = getPlatforms();
    console.log('Release build.');

    destDir = appsDir;

    var builder = new NwBuilder({
        files: './dist/**/*',
        buildDir: appsDir,
        platforms: platforms,
        flavor: 'normal',
        zip: false,
        macIcns: './images/inav_icon.icns',
        macPlist: { 'CFBundleDisplayName': 'INAV Blackbox Explorer'},
        winIco: './images/inav_icon.ico',
        version: get_nw_version()
    });
    builder.on('log', console.log);
    builder.build(function (err) {
        if (err) {
            console.log('Error building NW apps: ' + err);
//            done();
//            return;
            gulp.series(['clean-apps'], function() {
                process.exit(1);
            });
        }
        done();
    });
}));

// Create debug app directories in ./debug
gulp.task('debug', gulp.series(['dist', 'clean-debug'], function (done) {
    
    platforms = getPlatforms();
    console.log('Debug build.');

    destDir = debugDir;

    var builder = new NwBuilder({
        files: './dist/**/*',
        buildDir: debugDir,
        platforms: platforms,
        flavor: 'sdk',
        macIcns: './images/inav_icon.icns',
        macPlist: { 'CFBundleDisplayName': 'INAV Blackbox Explorer'},
        winIco: './images/inav_icon.ico',
        version: get_nw_version()
    });

    builder.on('log', console.log);
    builder.build(function (err) {
        if (err) {
            console.log('Error building NW apps: ' + err);
            gulp.series(['clean-debug'], function() {
                process.exit(1);
            });
        }

        var exec = require('child_process').exec;
        var run = getRunDebugAppCommand();
        console.log('Starting debug app (' + run + ')...');
        exec(run);
        done();
    });
            
    done();
}));

function build_win_zip(arch) {
    return function build_win_zip_proc(done) {
        var pkg = require('./package.json');
    
        // Create ZIP
        console.log(`Creating ${arch} ZIP file...`);
        var src = path.join(appsDir, pkg.name, arch);
        //var output = fs.createWriteStream(path.join(appsDir, get_release_filename(arch, 'zip', '-portable')));
        var output = fs.createWriteStream(path.join(appsDir, get_release_filename(arch, 'zip')));
        var archive = archiver('zip', {
                zlib: { level: 9 }
        });
        archive.on('warning', function(err) { throw err; });
        archive.on('error', function(err) { throw err; });
        archive.pipe(output);
        archive.directory(src, 'INAV Blackbox Explorer');
        return archive.finalize();
    }
}

function build_win_iss(arch) {
    return function build_win_iss_proc(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }

        // Create Installer
        console.log(`Creating ${arch} Installer...`);
        const innoSetup = require('@quanle94/innosetup');
            
        const APPS_DIR = './apps/';
        const pkg = require('./package.json');

        // Parameters passed to the installer script
        const parameters = [];

        // Extra parameters to replace inside the iss file
        parameters.push(`/Dversion=${pkg.version}`);
        parameters.push(`/DarchName=${arch}`);
        parameters.push(`/DarchAllowed=${(arch === 'win32') ? 'x86 x64' : 'x64'}`);
        parameters.push(`/DarchInstallIn64bit=${(arch === 'win32') ? '' : 'x64'}`);
        parameters.push(`/DsourceFolder=${APPS_DIR}`);
        parameters.push(`/DtargetFolder=${APPS_DIR}`);

        // Show only errors in console
        parameters.push(`/Q`);

        // Script file to execute
        parameters.push("assets/windows/installer.iss");

        innoSetup(parameters, {},
        function(error) {
            if (error != null) {
                console.error(`Installer for platform ${arch} finished with error ${error}`);
            } else {
                console.log(`Installer for platform ${arch} finished`);
            }
            done();
        });
    }
}

gulp.task('release-win32', gulp.series(build_win_zip('win32'), build_win_iss('win32')));
//gulp.task('release-win64', gulp.series(build_win_zip('win64'), build_win_iss('win64')));

gulp.task('release-osx64', function(done) {
    var pkg = require('./package.json');
    var src = path.join(appsDir, pkg.name, 'osx64', pkg.name + '.app');
    // Check if we want to sign the .app bundle
    if (getArguments().codesign) {
        // macapptool can be downloaded from
        // https://github.com/fiam/macapptool
        //
        // Make sure the bundle is well formed
        execSync('macapptool', '-v', '1', 'fix', src);
        // Sign
        const codesignArgs = ['macapptool', '-v', '1', 'sign'];
        const codesignIdentity = getArguments()['codesign-identity'];
        if (codesignIdentity) {
            codesignArgs.push('-i', codesignIdentity);
        }
        codesignArgs.push('-e', 'entitlements.plist');
        codesignArgs.push(src)
        execSync.apply(this, codesignArgs);

        // Check if the bundle is signed
        const codesignCheckArgs = [ 'codesign', '-vvv', '--deep', '--strict', src ];
        execSync.apply(this, codesignCheckArgs); 
    }

    // 'old' .zip mode
    if (!getArguments().installer) {
        const zipFilename = path.join(appsDir, get_release_filename('macOS', 'zip'));
        console.log('Creating ZIP file: ' + zipFilename);
        var output = fs.createWriteStream(zipFilename);
        var archive = archiver('zip', {
            zlib: { level: 9 }
        });
        archive.on('warning', function(err) { throw err; });
        archive.on('error', function(err) { throw err; });
        archive.pipe(output);
        archive.directory(src, 'INAV Blackbox Explorer.app');
        output.on('close', function() {
            if (getArguments().notarize) {
                console.log('Notarizing DMG file: ' + zipFilename);
                const notarizeArgs = ['macapptool', '-v', '1', 'notarize'];
                const notarizationUsername = getArguments()['notarization-username'];
                if (notarizationUsername) {
                    notarizeArgs.push('-u', notarizationUsername)
                }
                const notarizationPassword = getArguments()['notarization-password'];
                if (notarizationPassword) {
                    notarizeArgs.push('-p', notarizationPassword)
                }
                notarizeArgs.push(zipFilename)
                execSync.apply(this, notarizeArgs);
            }
            done();
        });
        archive.finalize();
    } 
    // 'new' .dmg mode
    else {
        const appdmg = require('appdmg');

        var target = path.join(appsDir, get_release_filename('macOS', 'dmg'));
        console.log('Creating DMG file: ' + target);
        var basepath = path.join(appsDir, pkg.name, 'osx64');
        console.log('Base path: ' + basepath);

        if (fs.existsSync(target)) {
            fs.unlinkSync(target);
        }

        var specs = {};

        specs["title"] = "INAV Backbox Explorer";
        specs["contents"] = [
            { "x": 448, "y": 342, "type": "link", "path": "/Applications" },
            { "x": 192, "y": 344, "type": "file", "path": pkg.name + ".app", "name": "INAV Blackbox Explorer.app" },
        ];
        specs["background"] = path.join(__dirname, 'assets/osx/dmg-background.png');
        specs["format"] = "UDZO";
        specs["window"] = {
            "size": {
                "width": 638,
                "height": 479,
            }
        };

        const codesignIdentity = getArguments()['codesign-identity'];
        if (getArguments().codesign) {
            specs['code-sign'] = {
                'signing-identity': codesignIdentity,
            }
        }

        const ee = appdmg({
            target: target,
            basepath: basepath,
            specification: specs,
        });

        ee.on('progress', function(info) {
            //console.log(info);
        });

        ee.on('error', function(err) {
            console.log(err);
        });

        ee.on('finish', function() {
            if (getArguments().codesign) {
                // Check if the bundle is signed
                const codesignCheckArgs = [ 'codesign', '-vvv', '--deep', '--strict', target ];
                execSync.apply(this, codesignCheckArgs);
            }
            if (getArguments().notarize) {
                console.log('Notarizing DMG file: ' + target);
                const notarizeArgs = ['xcrun', 'notarytool', 'submit'];
                notarizeArgs.push(target);
                const notarizationUsername = getArguments()['notarization-username'];
                if (notarizationUsername) {
                    notarizeArgs.push('--apple-id', notarizationUsername)
                } else {
                    throw new Error('Missing notarization username');
                }
                const notarizationPassword = getArguments()['notarization-password'];
                if (notarizationPassword) {
                    notarizeArgs.push('--password', notarizationPassword)
                } else {
                    throw new Error('Missing notarization password');
                }
                const notarizationTeamId = getArguments()['notarization-team-id'];
                if (notarizationTeamId) {
                    notarizeArgs.push('--team-id', notarizationTeamId)
                } else {
                    throw new Error('Missing notarization Team ID');
                }
                notarizeArgs.push('--wait');

                const notarizationWebhook = getArguments()['notarization-webhook'];
                if (notarizationWebhook) {
                    notarizeArgs.push('--webhook', notarizationWebhook);
                }
                execSync.apply(this, notarizeArgs);

                console.log('Stapling DMG file: ' + target);
                const stapleArgs = ['xcrun', 'stapler', 'staple'];
                stapleArgs.push(target);
                execSync.apply(this, stapleArgs);

                console.log('Checking DMG file: ' + target);
                const checkArgs = ['spctl', '-vvv', '--assess', '--type', 'install', target];
                execSync.apply(this, checkArgs);
            }
            done();
        });
    }
});

function post_build(arch, folder) {
    return function post_build_linux(done) {
        if ((arch === 'linux32') || (arch === 'linux64')) {
            const metadata = require('./package.json');
            // Copy Ubuntu launcher scripts to destination dir
            const launcherDir = path.join(folder, metadata.name, arch);
            console.log(`Copy Ubuntu launcher scripts to ${launcherDir}`);
            return gulp.src('assets/linux/**')
                    .pipe(gulp.dest(launcherDir));
        }

        return done();
    }
}

// Create the dir directory, with write permissions
function createDirIfNotExists(dir) {
    fs.mkdir(dir, '0775', function(err) {
        if (err && err.code !== 'EEXIST') {
            throw err;
        }
    });
}

function release_deb(arch) {
    return function release_deb_proc(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }

        // Check if dpkg-deb exists
        if (!commandExistsSync('dpkg-deb')) {
            console.warn(`dpkg-deb command not found, not generating deb package for ${arch}`);
            done();
            return null;
        }

        const deb = require('gulp-debian');
        const LINUX_INSTALL_DIR = '/opt/inav';
        const metadata = require('./package.json');

        console.log(`Generating deb package for ${arch}`);

        return gulp.src([path.join(appsDir, metadata.name, arch, '*')])
            .pipe(deb({
                package: metadata.name,
                version: metadata.version,
                section: 'base',
                priority: 'optional',
                architecture: getLinuxPackageArch('deb', arch),
                maintainer: metadata.author,
                description: metadata.description,
                preinst: [`rm -rf ${LINUX_INSTALL_DIR}/${metadata.name}`],
                postinst: [
                    `chown root:root ${LINUX_INSTALL_DIR}`,
                    `chown -R root:root ${LINUX_INSTALL_DIR}/${metadata.name}`,
                    `xdg-desktop-menu install ${LINUX_INSTALL_DIR}/${metadata.name}/${metadata.name}.desktop`,
                ],
                prerm: [`xdg-desktop-menu uninstall ${metadata.name}.desktop`],
                depends: ['libgconf-2-4', 'libatomic1'],
                changelog: [],
                _target: `${LINUX_INSTALL_DIR}/${metadata.name}`,
                _out: appsDir,
                _copyright: 'assets/linux/copyright',
                _clean: true,
        }));
    }
}

function post_release_deb(arch) {
    return function post_release_linux_deb(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }
        if ((arch === 'linux32') || (arch === 'linux64')) {
            var rename = require("gulp-rename");
            const metadata = require('./package.json');
            const renameFrom = path.join(appsDir, metadata.name + '_' + metadata.version + '_' + getLinuxPackageArch('.deb', arch) + '.deb');
            const renameTo = path.join(appsDir, get_release_filename_base(arch) + '_' + metadata.version + '.deb');
            // Rename .deb build to common naming
            console.log(`Renaming .deb installer ${renameFrom} to ${renameTo}`);
            return gulp.src(renameFrom)
                    .pipe(rename(renameTo))
                    .pipe(gulp.dest("."));
        }

        return done();
    }
}

function release_rpm(arch) {
    return function release_rpm_proc(done) {
        if (!getArguments().installer) {
            done();
            return null;
        }

        // Check if rpmbuild exists
        if (!commandExistsSync('rpmbuild')) {
            console.warn(`rpmbuild command not found, not generating rpm package for ${arch}`);
            done();
            return;
        }

        const buildRpm = require('rpm-builder');
        const NAME_REGEX = /-/g;
        const LINUX_INSTALL_DIR = '/opt/inav';
        const metadata = require('./package.json');

        console.log(`Generating rpm package for ${arch}`);

        // The buildRpm does not generate the folder correctly, manually
        createDirIfNotExists(appsDir);

        const options = {
            name: get_release_filename_base(arch), //metadata.name,
            version: metadata.version.replace(NAME_REGEX, '_'), // RPM does not like release candidate versions
            buildArch: getLinuxPackageArch('rpm', arch),
            vendor: metadata.author,
            summary: metadata.description,
            license: 'GNU General Public License v3.0',
            requires: ['libgconf-2-4', 'libatomic1'],
            prefix: '/opt',
            files: [{
                cwd: path.join(appsDir, metadata.name, arch),
                src: '*',
                dest: `${LINUX_INSTALL_DIR}/${metadata.name}`,
            }],
            postInstallScript: [`xdg-desktop-menu install ${LINUX_INSTALL_DIR}/${metadata.name}/${metadata.name}.desktop`],
            preUninstallScript: [`xdg-desktop-menu uninstall ${metadata.name}.desktop`],
            tempDir: path.join(appsDir, `tmp-rpm-build-${arch}`),
            keepTemp: false,
            verbose: false,
            rpmDest: appsDir,
            execOpts: { maxBuffer: 1024 * 1024 * 16 },
        };

        buildRpm(options, function(err) {
            if (err) {
                console.error(`Error generating rpm package: ${err}`);
            }
            done();
        });
    }
}

function getLinuxPackageArch(type, arch) {
    let packArch;

    switch (arch) {
    case 'linux32':
        packArch = 'i386';
        break;
    case 'linux64':
        if (type === 'rpm') {
            packArch = 'x86_64';
        } else {
            packArch = 'amd64';
        }
        break;
    default:
        console.error(`Package error, arch: ${arch}`);
        process.exit(1);
        break;
    }

    return packArch;
}

function releaseLinux(bits) {
    return function() {
        console.log(`Generating zip package for linux${bits}`);
        var dirname = 'linux' + bits;
        var pkg = require('./package.json');
        var src = path.join(appsDir, pkg.name, dirname);
        var output = fs.createWriteStream(path.join(appsDir, get_release_filename(dirname, 'tar.gz')));
        var archive = archiver('tar', {
            zlib: { level: 9 },
            gzip: true
        });
        archive.on('warning', function(err) { throw err; });
        archive.on('error', function(err) { throw err; });
        archive.pipe(output);
        archive.directory(src, 'INAV Blackbox Explorer');
        return archive.finalize();
    }
}

//gulp.task('release-linux32', gulp.series(releaseLinux(32), post_build('linux32', appsDir), release_deb('linux32')));
gulp.task('release-linux64', gulp.series(releaseLinux(64), post_build('linux64', appsDir), release_deb('linux64'), post_release_deb('linux64'), release_rpm('linux64')));

gulp.task('release', gulp.series('apps', 'clean-release',  getPlatforms().map(function(v) { return 'release-' + v; })));

gulp.task('default', gulp.series(['debug']));
