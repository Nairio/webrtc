import {initializeApp} from "firebase/app";
import {getDatabase, onValue, push, ref, remove, set} from "firebase/database";

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

const signalRef = ref(database, "signals");
const drawRef = ref(database, "draw");
const ons = {candidate: [], offer: [], answer: [], draw: null};
const myUserId = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

remove(signalRef);

onValue(signalRef, snapshot => {
    const data = snapshot.val();
    if (data && data.myUserId !== myUserId) {
        ons[data.type].forEach(on => on(JSON.parse(unescape(data.sdp)).shift()));
    }
});
onValue(drawRef, snapshot => {
    const data = snapshot.val();
    data && ons.draw(Object.values(data).map(d => ({...d, isMe: d.myUserId === myUserId})))
});

const firebaseIO = () => ({
    on: (type, cb) => ons[type].push(cb),
    emit: (type, sdp) => set(signalRef, {type, sdp: escape(JSON.stringify([sdp])), myUserId}),
    disconnect: () => {}
});

const firebaseDraw = ({
    on: (cb) => ons.draw = cb,
    set: (type, data) => set(push(drawRef), {type, data, myUserId}),
    clear: async () => {
        await remove(drawRef);
        await set(drawRef,{type: "deleted"})
    },
})

export {firebaseIO, firebaseDraw};


