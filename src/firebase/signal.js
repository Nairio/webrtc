import {onValue, ref, remove, set} from "firebase/database";
import {database} from "./firebase";
import {storage} from "../localstorage";

const signalRef = ref(database, "signals");
const ons = {candidate: [], offer: [], answer: []};



remove(signalRef);

onValue(signalRef, snapshot => {
    const data = snapshot.val();
    if(!data)return;
    const myUserName = storage("myUserName");
    const remoteUserName = storage("remoteUserName");

    if (data.myUserName === remoteUserName && data.remoteUserName === myUserName) {
        ons[data.type].forEach(on => on(JSON.parse(unescape(data.sdp)).shift()));
    }
});

const firebaseIO = () => ({
    on: (type, cb) => ons[type].push(cb),
    emit: async (type, sdp) => {
        const myUserName = storage("myUserName");
        const remoteUserName = storage("remoteUserName");
        type === "offer" && await remove(signalRef);
        await set(signalRef, {type, sdp: escape(JSON.stringify([sdp])), myUserName, remoteUserName})
    },
    disconnect: () => {}
});

export {firebaseIO};


