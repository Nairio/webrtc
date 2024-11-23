export const storage = (name, value) => {
    if (typeof value != "undefined") {
        localStorage[name] = escape(JSON.stringify([value]));
    } else {
        return JSON.parse(unescape( localStorage[name] ? localStorage[name] : escape(JSON.stringify([""])))).shift();
    }
};
