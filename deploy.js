const {exec} = require('child_process');
const rimraf = require("rimraf");
const fs = require('fs');

const run = (url, cwd) => {
    return new Promise((rs) => {
            console.log(`${url}\n\n\n`);
            exec(url, {cwd}, (e1, d, e2) => {
                    e1 && console.error(e1);
                    e2 && console.error(e2);
                    d && console.log(d);
                    rs("Done!")
                }
            )
        }
    );
}


(async () => {
    const dir = "../../firebase/public/webrtc";
    await run("npm run build");
    rimraf.sync(dir);
    fs.renameSync("build", dir);

    await run("firebase deploy --only hosting", "../../firebase/public");
})()

