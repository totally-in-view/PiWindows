const gulp = require("gulp");
const obfuscate = require("gulp-javascript-obfuscator");

gulp.task("removeLogging", ()=>{
    return gulp.src("./public/**/*.js").pipe(gulp_remove_logging({
        replaceWith: "0;",
        namespace: ["console"],
        methods: "log"
    })).pipe(gulp.dest("public/"));
})

gulp.task("obfuscate", ()=>{
    gulp.src("./build/*.js").pipe(obfuscate({
        compact: false,
        renameGlobals: true,
        stringArrayEncoding: "base64"
    })).pipe(gulp.dest("build"));
    return gulp.src("./build/static/js/*.js").pipe(obfuscate()).pipe(gulp.dest("build/static/js"));
})