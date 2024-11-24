import {ref, remove, onChildChanged, onChildAdded, update, push} from "firebase/database";
import {database} from "./firebase";
import {storage} from "../localstorage";
import {log} from "../App";

const signalRef = ref(database, "signals");
const ons = {candidate: [], offer: [], answer: [], close: []};
const signalRefChild = push(signalRef);


remove(signalRef);

const onChildChangedFunc = snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const myUserName = storage("myUserName");
    const remoteUserName = storage("remoteUserName");

    if (data.myUserName === remoteUserName && data.remoteUserName === myUserName) {
        log(`←<b style='color:red'>${data.type}</b>`);
        ons[data.type].forEach(on => on(JSON.parse(unescape(data.sdp)).shift()));
    }

}

onChildAdded(signalRef, onChildChangedFunc);
onChildChanged(signalRef, onChildChangedFunc);

const firebaseIO = () => ({
    on: (type, cb) => ons[type].push(cb),
    emit: async (type, sdp) => {
        const myUserName = storage("myUserName");
        const remoteUserName = storage("remoteUserName");

        sdp = escape(JSON.stringify([sdp]));
        log(`<b style='color:green'>${type}</b>→`);

        await update(signalRefChild, {type, sdp, myUserName, remoteUserName});
    },
    disconnect: () => {
    }
});

export {firebaseIO};


