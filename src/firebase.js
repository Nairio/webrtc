import {initializeApp} from "firebase/app";
import {getDatabase, onValue, ref, remove, set} from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCtlhAgGVp_un1wXcX9p8YHzNnYAwN2AxA",
    authDomain: "webrtc-dea1c.firebaseapp.com",
    databaseURL: "https://webrtc-dea1c-default-rtdb.firebaseio.com",
    projectId: "webrtc-dea1c",
    storageBucket: "webrtc-dea1c.firebasestorage.app",
    messagingSenderId: "490742715082",
    appId: "1:490742715082:web:33f0034c630bb084359a33",
    measurementId: "G-CHZTSQVGWS"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const dbRef = ref(database, "signals");
const ons = {candidate: [], offer: [], answer: []};
const myUserId = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
remove(dbRef);

onValue(dbRef, snapshot => {
    const data = snapshot.val();
    if (data && data.myUserId !== myUserId) {
        ons[data.type].forEach(on => on(JSON.parse(unescape(data.sdp)).shift()));
    }
})

const io = () => ({
    on: (type, cb) => ons[type].push(cb),
    emit: (type, sdp) => set(dbRef, {type, sdp: escape(JSON.stringify([sdp])), myUserId}),
    disconnect: () => {}
})

export {io};


