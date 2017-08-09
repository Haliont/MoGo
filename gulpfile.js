'use strict'

const gulp        = require('gulp'),
      uglify      = require('gulp-uglify'),
      pug         = require('gulp-pug'),
      cssmin      = require('gulp-clean-css'),
      sass        = require('gulp-sass'),
      concat      = require('gulp-concat'),
      plumber     = require('gulp-plumber'),
      rimraf      = require('rimraf'),
      cache       = require('gulp-cache'),
      mmq         = require('gulp-merge-media-queries'),
      prefix      = require('gulp-autoprefixer'),
      rename      = require('gulp-rename'),
      imagemin    = require('gulp-imagemin'),
      browserSync = require('browser-sync').create(),
      notify      = require('gulp-notify'),
      prettify    = require('gulp-html-prettify'),
      svgSprite   = require('gulp-svg-sprite'),
      svgmin      = require('gulp-svgmin'),
      cheerio     = require('gulp-cheerio'),
      replace     = require('gulp-replace');



var paths = {
  devDir: 'app/',          // Путь где производится разработка
  outputDir: 'dist/'       // Путь для конечной сборки
}

gulp.task('pug', function() {
  return gulp
    .src(paths.devDir + 'pages/*.pug')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          title: 'Pug',
          message: err.message
        };
      })
    }))
    .pipe(pug({
      pretty: true
    }))
    .pipe(prettify({
      brace_style: 'expand',
      indent_size: 1,
      indent_char: '\t',
      indent_inner_html: true,
      preserve_newlines: true
    }))
    .pipe(gulp.dest(paths.outputDir))
    .pipe(browserSync.stream());
});

// Компиляция sass в css
gulp.task('sass', function() {
  return gulp
    .src(paths.devDir + 'sass/main.sass')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          title: 'Sass',
          message: err.message
        };
      })
    }))
    .pipe(sass())
    .pipe(prefix({
      browsers: ['last 10 versions']
    }))
    .pipe(mmq())
    .pipe(cssmin())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(paths.outputDir + 'css/'))
    .pipe(browserSync.stream());
})

// Минификация кастомных скриптов JS
gulp.task('js', function() {
  return gulp
    .src([paths.devDir + 'scripts/*.js'])
    .pipe(uglify())
    .pipe(rename({
        suffix: '.min'
    }))
    .pipe(gulp.dest(paths.outputDir + 'scripts/'))
    .pipe(browserSync.stream());
});

//Оптимизируем изображения и кидаем их в кэш
gulp.task('img', function() {
  return gulp.src(paths.devDir + 'img/**/*')
    .pipe(cache(imagemin(
      [imagemin.gifsicle(),
      imagemin.jpegtran(), imagemin.optipng()]
      )
    ))
    .pipe(gulp.dest(paths.outputDir + 'img'));
});

// Запуск локального сервера из директории 'dist'
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: paths.outputDir
    },
    open: false,
    notify: false
  })
});

gulp.task('svg:sprite', function () {
  return gulp
    .src([paths.devDir + 'svg/*.svg', '!' + paths.devDir + 'svg/sprite.svg'])
    // minify svg
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    // remove all fill, style and stroke declarations in out shapes
    .pipe(cheerio({
      run: function ($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
        $('style').remove();
      },
      parserOptions: {xmlMode: true}
    }))
    // cheerio plugin create unnecessary string '&gt;', so replace it.
    .pipe(replace('&gt;', '>'))
    // build svg sprite
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: "../sprite.svg"
        }
      }
    }))
    .pipe(cheerio({
      run: function ($) {
        $('svg').attr('style', 'display: none');
      }
    }))
    .pipe(gulp.dest(paths.devDir + 'svg/'));
});

// Слежение за изменениями в файлах и перезагрузка страницы
gulp.task('default', ['img', 'svg:sprite', 'sass', 'pug', 'js', 'browser-sync'], function() {
  gulp.watch(paths.devDir + '**/*.pug', ['pug']);
  gulp.watch(paths.devDir + '**/*.sass', function(event, cb) {
    setTimeout(function(){gulp.start('sass');}, 100)
  });
  gulp.watch([paths.devDir + 'js/*.js', '!'+ paths.devDir +'js/*.min.js'], ['js']);
  gulp.watch(paths.outputDir + '*.html', browserSync.reload);
});

//Очистка папки конечной сборки
gulp.task('clean', function(cb) {
  rimraf(paths.outputDir, cb);
});

//Чистим кэш
gulp.task('clear', function() {
    return cache.clearAll();
});