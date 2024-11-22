import {onValue, push, ref, remove, set} from "firebase/database";
import {database} from "../firebase/firebase";
import {myUserId} from "../index";

const drawRef = ref(database, "draw");
const ons = {candidate: [], offer: [], answer: [], draw: null};

onValue(drawRef, snapshot => {
    ons.data = snapshot.val();
    ons.data && ons.draw(Object.values(ons.data).map(d => ({...d, isMe: d.myUserId === myUserId})))
});

const firebaseDraw = ({
    on: (cb) => ons.draw = cb,
    set: (type, data) => set(push(drawRef), {type, data, myUserId}),
    clear: async () => {
        await remove(drawRef);
        await set(drawRef,{type: "deleted"})
    }
})

export {firebaseDraw};


