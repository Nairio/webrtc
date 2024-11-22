import {initializeApp} from "firebase/app";
import {getDatabase} from "firebase/database";

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
export const database = getDatabase(app);
