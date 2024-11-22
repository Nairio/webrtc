import {onValue, ref, remove, set} from "firebase/database";
import {myUserId} from "../index";
import {database} from "./firebase";

const signalRef = ref(database, "signals");
const ons = {candidate: [], offer: [], answer: []};

remove(signalRef);

onValue(signalRef, snapshot => {
    const data = snapshot.val();
    if (data && data.myUserId !== myUserId) {
        ons[data.type].forEach(on => on(JSON.parse(unescape(data.sdp)).shift()));
    }
});

const firebaseIO = () => ({
    on: (type, cb) => ons[type].push(cb),
    emit: (type, sdp) => set(signalRef, {type, sdp: escape(JSON.stringify([sdp])), myUserId}),
    disconnect: () => {}
});

export {firebaseIO};


