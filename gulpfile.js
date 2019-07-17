"use strict";

const $ = require('gulp-load-plugins')(),
gulp = require("gulp"),
bourbon = require('node-bourbon'),
browserSync = require('browser-sync').create(),
del = require('del'),
pngquant = require('imagemin-pngquant'),
gutil = require('gulp-util'),
ftp = require("vinyl-ftp"),
sourcemaps = require("gulp-sourcemaps"),
postcss = require("gulp-postcss"),
prefixer = require("autoprefixer"),
sftp = require("gulp-sftp");


let process = require("child_process"),
	connectionSettings = require("./accesses/accesses.js");

const templatePath = connectionSettings.server.path;
const remotePathCss = templatePath+"css",
	remotePathJs = templatePath+"js",
	remotePathImg = templatePath+"img";

const xpager_conn = ftp.create({
	host:      connectionSettings.xpager.host,
	user:      connectionSettings.xpager.user,
	password:  connectionSettings.xpager.password,
	parallel: 4,
	log: gutil.log
});


const server_conn = ftp.create({
	host:      connectionSettings.server.host,
	user:      connectionSettings.server.user,
	password:  connectionSettings.server.password,
	parallel: 2,
	log: gutil.log
});


var g_if = true;

gulp.task('browser-sync', () =>  {
	browserSync.init({
		server: {
			baseDir: 'app'
		},
		notify: false
	});

	browserSync.watch([
		"app/css/*.css",
		"app/js/*.js",
		"app/*.html",
		]).on("change", browserSync.reload);
});

gulp.task("jade", () => 
	gulp.src("app/jade/*.jade",  {since: gulp.lastRun("jade")})
		.pipe($.jade({pretty: true}))
		.pipe(gulp.dest("app"))
);

gulp.task('sass', () => 
	gulp.src('app/sass/*.sass')
		.pipe($.if(g_if, sourcemaps.init()))
		.pipe($.sass({
			includePaths: bourbon.includePaths,
			outputStyle: 'expanded'
		}).on("error", $.notify.onError()))
		.pipe($.if(g_if, sourcemaps.write(".")))
		.pipe(gulp.dest('app/css'))
);

gulp.task("base64", () =>
	gulp.src("app/css/*.css")
		.pipe($.cache($.base64({
			extensions: ['svg', 'png', /\.jpg#datauri$/i],
			exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
			maxImageSize: 8*1024, // bytes,
			deleteAfterEncoding: false,
		})))
		.pipe(gulp.dest("app/css"))
);

gulp.task("base64-post", () => 
	gulp.src("app/css/main.css")
		.pipe(postcss([require('postcss-data-packer')({
				dest: 'app/css/main_data.css'
				})
			])
		)
		.pipe(gulp.dest("app/css"))
);

gulp.task("prefixer", () => 
	gulp.src("app/css/*.css")
		.pipe(postcss([prefixer({ 
			browsers: ['last 4 versions', '> 5%', 'ie 11'],
			cascade: true 
			}),
			require("postcss-flexbugs-fixes")
		]))
		.pipe(gulp.dest("app/css"))
);

gulp.task('imagemin', () =>  
	gulp.src('app/img/**/*', {since: gulp.lastRun("imagemin")})
		.pipe($.cache($.imagemin({
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
		.pipe(gulp.dest('app/img'))
);

gulp.task("babel", () => 
	gulp.src("app/js-es6/**/*", {since: gulp.lastRun("babel")})
		.pipe(sourcemaps.init())
		.pipe($.babel(
			{
				presets: ["env"],
				plugins: [
					"syntax-async-functions",
					"transform-regenerator",
					"transform-runtime",
					//"babel-polyfill",
				]
			}
		))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest("app/js-tmp"))
);

gulp.task("webpack", () => 
	gulp.src("app/js/common.js", {since: gulp.lastRun("webpack")})
		.pipe($.webpack({
			entry: [
				"babel-polyfill",
				"./app/js-tmp/common.js",
			],
			devtool: "source-map",
			output: {
				filename: "common.js",
				//path: "/app/js/",
			},
			module: {
				rules: {
					test: "/\.js$/",
					loader: "babel-loader",
					exclude: /(node_modules|bower_components)/,
          query: {
              presets: ['env']
          }
				}
			}
		}))
		.pipe(gulp.dest("app/js"))
);

function pre_build(callback){
	g_if = false;
	callback();
}

gulp.task('remove', (callback) =>  {del.sync('app/css/main_data.css'); callback();});

gulp.task("make:css", gulp.series(pre_build, "remove", gulp.parallel("sass", "imagemin"), "prefixer", "base64", "base64-post"));

gulp.task('removedist', (callback) =>  {del.sync('dist'); callback();});

gulp.task("build:css", () => 
	gulp.src("app/css/**/*").pipe(gulp.dest('dist/css/'))
);

gulp.task("build:files", (callback) => gulp.src('app/*.ico').pipe(gulp.dest('dist')));

gulp.task("build:fonts", () => gulp.src('app/fonts/**/*').pipe(gulp.dest('dist/fonts')));

gulp.task("build:js", () => gulp.src('app/js/**/*').pipe(gulp.dest('dist/js')));

gulp.task("build:images", () => gulp.src("app/img/**/*").pipe(gulp.dest("dist/img")));

gulp.task("build:html", () => gulp.src('app/*.html').pipe(gulp.dest('dist')));

gulp.task('build', gulp.series(gulp.parallel(pre_build, 'removedist', "imagemin"), "make:css", gulp.parallel('build:css', "build:js", "build:fonts", "build:files", "build:html"), 'build:images'));

gulp.task("deploy:xpager", () => 
	gulp.src("dist/**", {buffer: false})
			.pipe(xpager_conn.dest(connectionSettings.xpager.dirName))
);

gulp.task('deploy',gulp.series("build", "deploy:xpager"));

gulp.task('clearcache', (callback) => { $.cache.clearAll(); callback();});

gulp.task("deploy-zip", () => 
	gulp.src([
			"**/*.*",
			"!node_modules/**",
			"!bower_components/**",
			"!config/**",
			"!dist/**",
			"!*.zip"
			])
		.pipe($.zip("app.zip"))
		.pipe(xpager_conn.dest(connectionSettings.xpager.dirName))
);

gulp.task("min:css", () => 
	gulp.src("app/css/*.css")
		.pipe($.cssmin())
		.pipe(gulp.dest("app/css"))
);

gulp.task("deploy:css", () => 
	gulp.src("app/css/*.*", {since: gulp.lastRun("sass")})
		.pipe(server_conn.dest(remotePathCss))
);

gulp.task("deploy:js", () => 
	gulp.src("app/js/*.js", {since: gulp.lastRun("deploy:js")})
		//.pipe($.uglify())
		.pipe(server_conn.dest(remotePathJs))
);

gulp.task("deploy:img", () => 
	gulp.src("app/img/**/*")
		.pipe(server_conn.dest(remotePathImg))
);

function local_watch(){
	gulp.watch('app/sass/**/*.sass', gulp.series("sass"));
	gulp.watch('app/jade/**/*', gulp.series("jade"));
	gulp.watch("app/js-es6/**/*", gulp.series("babel", "webpack"));
}

function watch(){
	gulp.watch('app/sass/**/*.sass', gulp.series("sass", "deploy:css"));
	gulp.watch('app/js-es6/**/*.js', gulp.series("babel", "webpack"));
	gulp.watch('app/js/**/*.js', gulp.series("deploy:js"));
	gulp.watch('app/img/*.*', gulp.series("imagemin", "deploy:img"));
}

gulp.task("finish:him", gulp.series(pre_build, "make:css", "min:css", "babel", "webpack", gulp.parallel("deploy:css", "deploy:js")));

gulp.task("deploy-to-server", gulp.series("sass", watch));

gulp.task('default', gulp.series("sass", gulp.parallel(local_watch, "browser-sync")));